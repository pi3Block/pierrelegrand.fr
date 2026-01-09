# Construire sa collection NFT avec Flutter

**Auteur:** pro@pierrelegrand.fr
**Date de publication:** 23 mars 2022
**Dernière modification:** 26 septembre 2022
**Catégorie:** Tutoriel

---

## Vue d'ensemble

Ce tutoriel couvre la création d'une collection NFT complète déployée sur OpenSea. Il combine deux applications Flutter : une pour générer de l'art, une pour gérer le contrat intelligent. Le projet utilise IPFS, Pinata, MetaMask, Hardhat, Solidity, OpenZeppelin et Polygon.

> "Si vous recherchez simplement un moyen simple et rapide de créer une collection et la vendre, consultez LaunchMyNFT.io ou un site similaire."

## Étapes du projet

### 1. Comprendre le développement

L'exemple utilise OpenSea pour lister les NFT. La collection de démonstration "The Bling NFT Collection" illustre le résultat final attendu avec métadonnées et propriétés visibles.

### 2. Générer de l'art

#### Architecture

La classe `ArtWork` définit chaque image avec trois traits :
- Indice de couleur d'arrière-plan
- Indice de couleur de premier plan
- Indice de rayon du cercle (1-10)

#### Installation du projet

```bash
flutter create gen_art
cd gen_art
```

Ajouter à `pubspec.yaml` :

```yaml
dependencies:
  flutter:
    sdk: flutter
  path_provider: ^2.0.8
```

#### Code principal - main.dart

```dart
import 'package:flutter/material.dart';
import 'dart:math';
import 'dart:io';
import 'dart:typed_data';
import 'package:path_provider/path_provider.dart';
import 'artpainter.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Generate art',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const MyHomePage(title: 'Generate art'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({Key? key, required this.title}) : super(key: key);
  final String title;

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  ArtWork artWork = ArtWork();
  int numberOfColors = Colors.primaries.length;
  GlobalKey paintAreaKey = GlobalKey();

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    return Scaffold(
      appBar: AppBar(title: Text(artWork.title)),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            CustomPaint(
              key: paintAreaKey,
              foregroundPainter: ArtPainter(artWork),
              size: Size(width/2, width)
            ),
          ],
        ),
      ),
      floatingActionButton: ElevatedButton(
        child: const Text('Press to make 10 NFTs'),
        onPressed: () async {
          Directory appDocDir = await getApplicationDocumentsDirectory();
          String appDocPath = appDocDir.path;
          var random = Random();

          for (int i = 0; i < 10; i++) {
            artWork.title = 'Circle $i';
            artWork.backgroundIndex = random.nextInt(numberOfColors);
            artWork.forgroundIndex = random.nextInt(numberOfColors);

            while (artWork.forgroundIndex == artWork.backgroundIndex) {
              artWork.forgroundIndex = random.nextInt(numberOfColors);
            }

            artWork.radiusIndex = random.nextInt(10) + 1;

            Uint8List pngBytes = await getPng(artWork);
            var myFile = File(appDocPath + '/' + artWork.title + '.png');
            myFile.writeAsBytesSync(pngBytes);

            String traits = '[{"trait_type":"BgColor",'
              '"value": "${artWork.backgroundIndex}"},'
              '{"trait_type":"FgColor",'
              '"value": "${artWork.forgroundIndex}"},'
              '{"trait_type":"Radius",'
              '"value": "${artWork.radiusIndex}"}]';

            String nftJson = '{"name": "${artWork.title}",'
              '"description": "This is circle number $i",'
              '"image": "ipfs://IMAGES_CID/${artWork.title}.png",'
              '"attributes": $traits}';

            myFile = File(appDocPath + '/' + artWork.title + '.json');
            myFile.writeAsStringSync(nftJson);
            setState(() {});
            await Future.delayed(const Duration(milliseconds: 1000));
          }
        },
      ),
    );
  }
}
```

#### Code du peintre - artpainter.dart

```dart
import 'package:flutter/material.dart';
import 'dart:typed_data';
import 'dart:ui' as ui;

class ArtPainter extends CustomPainter {
  ArtWork artWork;
  ArtPainter(this.artWork);

  @override
  void paint(Canvas canvas, Size size) {
    drawArt(artWork, canvas, size);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => true;
}

Future<Uint8List> getPng(ArtWork artWork) async {
  ui.PictureRecorder pictureRecorder = ui.PictureRecorder();
  Canvas canvas = Canvas(pictureRecorder,
    Rect.fromLTWH(0, 0, artWork.artSize.width, artWork.artSize.height));
  drawArt(artWork, canvas, artWork.artSize);
  final ui.Picture picture = pictureRecorder.endRecording();
  ui.Image img = await picture.toImage(
    artWork.artSize.width.toInt(),
    artWork.artSize.height.toInt());
  final byteData = await img.toByteData(format: ui.ImageByteFormat.png);
  Uint8List pngBytes = byteData!.buffer.asUint8List();
  return pngBytes;
}

void drawArt(ArtWork artWork, Canvas canvas, Size size) {
  canvas.clipRect(Rect.fromLTWH(0, 0, size.width, size.height));
  List<Color> colorValues = Colors.primaries;
  Color bgColor = colorValues[artWork.backgroundIndex];
  canvas.drawColor(bgColor, BlendMode.src);

  Offset center = Offset(size.width/2, size.height/2);
  double radius = size.width * artWork.radiusIndex.toDouble() / 20.0;
  Color fgColor = colorValues[artWork.forgroundIndex];
  Paint paint = Paint()..color = fgColor;
  canvas.drawCircle(center, radius, paint);
}

class ArtWork {
  String title;
  Size artSize;
  int backgroundIndex;
  int forgroundIndex;
  int radiusIndex;

  ArtWork({
    this.title = 'Generate art',
    this.artSize = const Size(500, 1000),
    this.backgroundIndex = 0,
    this.forgroundIndex = 2,
    this.radiusIndex = 5
  });
}
```

#### Préparation pour IPFS

Créer dossiers `Images` et `JSON`. Script `updatejson.js` pour remplacer les placeholders :

```javascript
var fs = require('fs')
const IMAGES_CID = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
console.log('Images CID', IMAGES_CID);

if (process.argv.length != 4)
  return console.log('Enter first and last circle number');

const myArgs = process.argv.slice(2);
var first = parseInt(myArgs[0]);
var last = parseInt(myArgs[1]);

for (var i = first; i <= last; i++) {
  var fileName = 'JSON/Circle ' + i.toString() + '.json';
  console.log('Updating file', fileName);
  const data = fs.readFileSync(fileName, { encoding: 'utf8', flag: 'r' });
  var result = data.replace("IMAGES_CID", IMAGES_CID);
  fs.writeFileSync(fileName, result);
}
```

Exécution : `node updatejson.js 0 9`

### 3. Configurer un portefeuille

#### Installation MetaMask

Installer l'extension Chrome depuis [metamask.io](https://metamask.io/). Ajouter les réseaux Polygon et Mumbai via PolygonScan.

#### Obtenir des tokens de test

1. Basculer vers Mumbai dans MetaMask
2. Copier l'adresse du portefeuille
3. Visiter le [robinet Polygon](https://faucet.polygon.technology/)
4. Soumettre l'adresse, recevoir 0,5 MATIC

### 4. Créer et déployer un contrat intelligent

#### Installation Hardhat

```bash
npm install -g hardhat
npx hardhat
npm install --save-dev "hardhat@2.8.3"
npm install --save-dev "@nomiclabs/hardhat-waffle@2.0.0"
npm install --save-dev "ethereum-waffle@3.0.0"
npm install --save-dev "chai@4.2.0"
npm install --save-dev "@nomiclabs/hardhat-ethers@2.0.0"
npm install --save-dev "ethers@5.0.0"
npm install @nomiclabs/hardhat-etherscan
npm install @openzeppelin/contracts
npm install dotenv
```

#### Fichier .env

```env
CONTRACT_NAME = "Cercles de John Doe Collection"
CONTRACT_SYMBOL = "CICD"
CONTRACT_ADDRESS = ""
WALLET_OWNER = "0x6f3298d259e6EC1c48FA0d6265E8D49ad78EBFD7"
WALLET_PRIVATE_KEY = "ecb5bfd5be173f61c24415bd3787600caeb3f0c50ebe3827e168da7e0b751a68"
POLYGONSCAN_KEY = ""
ALCHEMY_KEY_TEST = ""
ALCHEMY_KEY_PROD = ""
JSON_CID = "QmQuXH6UCaY9iAYt5VcrTurF4BBeLC3XxxRfMxCuU4g3Gu"
IMAGES_CID = "QmPDLL5r7mxDZ3nhVVFzLxE5fRxxfDW1UAqeZsvRYoEzdq"
```

> "Quelqu'un qui connaît cette clé peut voler tous les actifs de votre portefeuille."

#### Configuration Hardhat - hardhat.config.js

```javascript
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
const ALCHEMY_KEY_TEST = process.env.ALCHEMY_KEY_TEST;
const ALCHEMY_KEY_PROD = process.env.ALCHEMY_KEY_PROD;
const POLYGONSCAN_KEY = process.env.POLYGONSCAN_KEY;

module.exports = {
  networks: {
    Mumbai: {
      url: ALCHEMY_KEY_TEST,
      accounts: [WALLET_PRIVATE_KEY]
    },
    Main: {
      url: ALCHEMY_KEY_PROD,
      accounts: [WALLET_PRIVATE_KEY]
    },
  },
  solidity: "0.8.4",
  etherscan: {
    apiKey: POLYGONSCAN_KEY
  }
};
```

#### Contrat Solidity - contracts/NFT.sol

```solidity
//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import '@openzeppelin/contracts/utils/Counters.sol';
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC721, Ownable {
    uint256 public tokenCounter;
    mapping (uint256 => string) private _tokenURIs;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        tokenCounter = 0;
    }

    function mint(string memory _tokenURI) public {
        _safeMint(msg.sender, tokenCounter);
        _setTokenURI(tokenCounter, _tokenURI);
        tokenCounter++;
    }

    function _setTokenURI(uint256 _tokenId, string memory _tokenURI)
      internal virtual {
        require(
            _exists(_tokenId),
            "ERC721Metadata: URI set of nonexistent token"
        );
        _tokenURIs[_tokenId] = _tokenURI;
    }

    function tokenURI(uint256 _tokenId)
      public view virtual override returns(string memory) {
        require(
            _exists(_tokenId),
            "ERC721Metadata: URI set of nonexistent token"
        );
        return _tokenURIs[_tokenId];
    }

    function isApprovedForAll(
        address _owner,
        address _operator
    ) public override view returns (bool isOperator) {
        if (_operator == address(0x58807baD0B376efc12F5AD86aAc70E78ed67deaE)) {
            return true;
        }
        return ERC721.isApprovedForAll(_owner, _operator);
    }
}
```

#### Compilation et déploiement

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network Mumbai
```

#### Script de déploiement - scripts/deploy.js

```javascript
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const CONTRACT_NAME = process.env.CONTRACT_NAME;
  const CONTRACT_SYMBOL = process.env.CONTRACT_SYMBOL;
  const NFT = await hre.ethers.getContractFactory("NFT");
  const nft = await NFT.deploy(CONTRACT_NAME, CONTRACT_SYMBOL);
  await nft.deployed();
  let msg = CONTRACT_NAME + ' (' + CONTRACT_SYMBOL+ ') deployed to: ';
  console.log(msg, nft.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

#### Vérification du contrat - scripts/verify.js

```javascript
const hre = require("hardhat");
require("dotenv").config();

async function main() {
    const CONTRACT_NAME = process.env.CONTRACT_NAME;
    const CONTRACT_SYMBOL = process.env.CONTRACT_SYMBOL;
    const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

    await hre.run("verify:verify", {
        address: CONTRACT_ADDRESS,
        constructorArguments: [CONTRACT_NAME, CONTRACT_SYMBOL]
    });

    let msg = CONTRACT_NAME + ' (' + CONTRACT_SYMBOL + ') verified at: ';
    console.log(msg, CONTRACT_ADDRESS);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

Exécution :

```bash
npx hardhat run scripts/verify.js --network Mumbai
```

### 5. Application Flutter pour gérer le contrat

#### Setup

```bash
flutter create nft_contract
```

Mise à jour `pubspec.yaml` :

```yaml
name: nft_contract
description: Gérer le contrat NFT
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: ">=2.15.0 <3.0.0"

dependencies:
  flutter:
    sdk: flutter
  web3dart: ^2.3.1
  http: ^0.13.4
  flutter_dotenv: ^5.0.2

dev_dependencies:
  flutter_test:
    sdk: flutter

flutter:
  uses-material-design: true
  assets:
    - assets/abi.json
    - .env
```

#### Code principal - lib/main.dart

```dart
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:web3dart/web3dart.dart';

Future main() async {
  await dotenv.load(fileName: ".env");
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Circles contract',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: MyHomePage(title: 'Circles contract'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  MyHomePage({Key? key, required this.title}) : super(key: key);
  final String title;

  @override
  _MyHomePageState createState() => _MyHomePageState();
}

enum Mode { none, shownfts, mint }

class _MyHomePageState extends State<MyHomePage> {
  final CONTRACT_NAME = dotenv.env['CONTRACT_NAME'];
  final CONTRACT_ADDRESS = dotenv.env['CONTRACT_ADDRESS'];
  Mode mode = Mode.none;
  http.Client httpClient = http.Client();
  late Web3Client polygonClient;
  int tokenCounter = -1;
  String tokenSymbol = '';
  TextEditingController controller1 = TextEditingController();
  TextEditingController controller2 = TextEditingController();
  Uint8List? mintedImage;
  int mintedCircleNo = 0;

  @override
  void initState() {
    final ALCHEMY_KEY = dotenv.env['ALCHEMY_KEY_TEST'];
    super.initState();
    httpClient = http.Client();
    polygonClient = Web3Client(ALCHEMY_KEY!, httpClient);
  }

  // ... reste du code disponible dans le tutoriel complet
}
```

### 6. Lister sur OpenSea

1. Accéder à [testnets.opensea.io](https://testnets.opensea.io/)
2. Rechercher votre collection
3. Éditer les informations (logo, description)
4. Créer des annonces pour chaque NFT avec prix et durée

> "Pour les grandes collections, automatiser via l'API OpenSea (Ethereum uniquement) ou des outils comme Puppeteer."

### 7. Passer à la production

#### Financement du portefeuille

Obtenir MATIC réel via Coinbase, Binance ou Transak.

#### Déploiement production

```bash
npx hardhat run scripts/deploy.js --network Main
npx hardhat run scripts/verify.js --network Main
```

#### Mise à jour de l'application

Modifier dans `initState()` de `nft_contract` :

```dart
final ALCHEMY_KEY = dotenv.env['ALCHEMY_KEY_PROD'];
```

#### Listing final

Lister sur [OpenSea.io](https://opensea.io/) (production) et configurer les gains du créateur (maximum 10%).

---

## Conclusion

> "Nous avons couvert beaucoup de terrain. Si vous avez aimé, merci d'applaudir."

Ce tutoriel fournit une introduction complète à la création d'une collection NFT fonctionnelle, de la génération d'art à la mise en vente publique, combinant Flutter avec les technologies Web3 modernes.
