/**
 * Pool de Web Workers pour la génération parallèle de chunks
 * Gère le cycle de vie des workers et la distribution des tâches
 */

import * as Comlink from 'comlink'
import type { ChunkWorkerAPI, ChunkGenerationParams, ChunkGenerationResult } from './chunkWorker'

interface WorkerInstance {
  worker: Worker
  api: Comlink.Remote<ChunkWorkerAPI>
  busy: boolean
  taskCount: number
}

interface PendingTask {
  params: ChunkGenerationParams
  resolve: (result: ChunkGenerationResult) => void
  reject: (error: Error) => void
  priority: number
}

class ChunkWorkerPool {
  private workers: WorkerInstance[] = []
  private pendingTasks: PendingTask[] = []
  private maxWorkers: number
  private initialized = false

  constructor(maxWorkers?: number) {
    // Utiliser le nombre de cœurs CPU - 1, minimum 1, maximum 4
    this.maxWorkers = maxWorkers ?? Math.min(Math.max(1, navigator.hardwareConcurrency - 1), 4)
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    console.log(`[WorkerPool] Initializing ${this.maxWorkers} workers...`)

    for (let i = 0; i < this.maxWorkers; i++) {
      try {
        const worker = new Worker(
          new URL('./chunkWorker.ts', import.meta.url),
          { type: 'module' }
        )

        const api = Comlink.wrap<ChunkWorkerAPI>(worker)

        // Test de connexion
        const pong = await api.ping()
        if (pong !== 'pong') {
          throw new Error('Worker ping failed')
        }

        this.workers.push({
          worker,
          api,
          busy: false,
          taskCount: 0,
        })

        console.log(`[WorkerPool] Worker ${i + 1} initialized`)
      } catch (error) {
        console.error(`[WorkerPool] Failed to initialize worker ${i + 1}:`, error)
      }
    }

    this.initialized = true
    console.log(`[WorkerPool] ${this.workers.length} workers ready`)
  }

  private getAvailableWorker(): WorkerInstance | null {
    // Trouver le worker le moins occupé
    const available = this.workers
      .filter(w => !w.busy)
      .sort((a, b) => a.taskCount - b.taskCount)

    return available[0] ?? null
  }

  private processPendingTasks(): void {
    // Trier par priorité (haute priorité = proche du joueur)
    this.pendingTasks.sort((a, b) => b.priority - a.priority)

    while (this.pendingTasks.length > 0) {
      const worker = this.getAvailableWorker()
      if (!worker) break

      const task = this.pendingTasks.shift()
      if (!task) break

      this.executeTask(worker, task)
    }
  }

  private async executeTask(
    workerInstance: WorkerInstance,
    task: PendingTask
  ): Promise<void> {
    workerInstance.busy = true
    workerInstance.taskCount++

    try {
      const result = await workerInstance.api.generateChunk(task.params)
      task.resolve(result)
    } catch (error) {
      task.reject(error instanceof Error ? error : new Error(String(error)))
    } finally {
      workerInstance.busy = false
      // Traiter les tâches en attente
      this.processPendingTasks()
    }
  }

  /**
   * Générer un chunk de terrain
   * @param params Paramètres de génération
   * @param priority Priorité (plus haute = traité en premier)
   */
  async generateChunk(
    params: ChunkGenerationParams,
    priority = 0
  ): Promise<ChunkGenerationResult> {
    if (!this.initialized) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      const task: PendingTask = {
        params,
        resolve,
        reject,
        priority,
      }

      this.pendingTasks.push(task)
      this.processPendingTasks()
    })
  }

  /**
   * Générer plusieurs chunks en parallèle
   */
  async generateChunks(
    paramsList: ChunkGenerationParams[],
    priorityFn?: (params: ChunkGenerationParams) => number
  ): Promise<ChunkGenerationResult[]> {
    if (!this.initialized) {
      await this.initialize()
    }

    const promises = paramsList.map((params, index) => {
      const priority = priorityFn ? priorityFn(params) : -index
      return this.generateChunk(params, priority)
    })

    return Promise.all(promises)
  }

  /**
   * Annuler toutes les tâches en attente
   */
  cancelPendingTasks(): void {
    const cancelled = this.pendingTasks.length
    this.pendingTasks.forEach(task => {
      task.reject(new Error('Task cancelled'))
    })
    this.pendingTasks = []

    if (cancelled > 0) {
      console.log(`[WorkerPool] Cancelled ${cancelled} pending tasks`)
    }
  }

  /**
   * Obtenir les statistiques du pool
   */
  getStats(): {
    totalWorkers: number
    busyWorkers: number
    pendingTasks: number
    totalTasksProcessed: number
  } {
    const busyWorkers = this.workers.filter(w => w.busy).length
    const totalTasksProcessed = this.workers.reduce((sum, w) => sum + w.taskCount, 0)

    return {
      totalWorkers: this.workers.length,
      busyWorkers,
      pendingTasks: this.pendingTasks.length,
      totalTasksProcessed,
    }
  }

  /**
   * Terminer tous les workers
   */
  terminate(): void {
    this.cancelPendingTasks()

    this.workers.forEach((workerInstance, index) => {
      workerInstance.worker.terminate()
      console.log(`[WorkerPool] Worker ${index + 1} terminated`)
    })

    this.workers = []
    this.initialized = false
  }
}

// Instance singleton du pool
let poolInstance: ChunkWorkerPool | null = null

/**
 * Obtenir l'instance du pool de workers
 */
export function getWorkerPool(): ChunkWorkerPool {
  if (!poolInstance) {
    poolInstance = new ChunkWorkerPool()
  }
  return poolInstance
}

/**
 * Terminer le pool de workers
 */
export function terminateWorkerPool(): void {
  if (poolInstance) {
    poolInstance.terminate()
    poolInstance = null
  }
}

export { ChunkWorkerPool }
export type { ChunkGenerationParams, ChunkGenerationResult }
