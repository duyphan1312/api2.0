const { Gateway, Wallets, } = require('fabric-network');
const fs = require('fs');
const path = require("path")
const log4js = require('log4js');
const logger = log4js.getLogger('BasicNetwork');
const util = require('util')


const helper = require('./helper')
const query = async (channelName, chaincodeName, args, fcn, username, org_name) => {

    try {
        console.log(`arguments type is------------------------------------------------------------- ${typeof args}`)
        console.log(`length of args is------------------------------------------------------------ ${args.length}`)
        // load the network configuration
        // const ccpPath = path.resolve(__dirname, '..', 'config', 'connection-org1.json');
        // const ccpJSON = fs.readFileSync(ccpPath, 'utf8')
        const ccp = await helper.getCCP(org_name) //JSON.parse(ccpJSON);

        // Create a new file system based wallet for managing identities.
        const walletPath = await helper.getWalletPath(org_name) //.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        let identity = await wallet.get(username);
        if (!identity) {
            console.log(`An identity for the user ${username} does not exist in the wallet, so registering user`);
            await helper.getRegisteredUser(username, org_name, true)
            identity = await wallet.get(username);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet, identity: username, discovery: { enabled: true, asLocalhost: false }
        });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contract = network.getContract(chaincodeName);
        let result;

        if (fcn == "queryTreatmentByID" || fcn == "queryTreatmentByDate" ||fcn == "queryAlltreatments" || fcn =="queryTreatmentByStaffID" || fcn == 'getTreatmentHistory' || fcn=='restictedMethod') {
            console.log(`arguments type is------------------------------------------------------------- ${typeof args}`)
            console.log(`length of args is------------------------------------------------------------ ${args.length}`)
            result = await contract.evaluateTransaction(fcn, args[0]);

        } else if (fcn == "readPrivatetreatment" || fcn == "queryPrivateDataHash"
        || fcn == "queryTreatmentByDateRange") {
            result = await contract.evaluateTransaction(fcn, args[0], args[1]);
            // return result
        }
        //  else if (fcn == "GetTransactionByID") {
        //     result = await contract.evaluateTransaction(fcn, channelName, args[0]);

            

        //     const fs = require('fs')
        //     fs.writeFileSync('./app/data/transactionData.block', result)

        //     let runScript = () => new Promise((resolve, reject) => {
        //         const { exec } = require('child_process');
        //         exec('sh ./app/transaction-decoder.sh',
        //             (error, stdout, stderr) => {
        //                 console.log(stdout);
        //                 console.log(stderr);
        //                 if (error !== null) {
        //                     console.log(`exec error: ${error}`);
        //                     reject(false)
        //                 } else {
        //                     resolve(true)
        //                 }
        //             });
        //     })

        //     result = await runScript()
        //     result = fs.readFileSync('./app/data/transaction.json')

        //     result = JSON.parse(result)


        //     // let decoder = new BlockDecoder()
        //     // console.log("Decoder is ", decoder)
        //     // result =  blockDecoder.decodeTransaction(result)
        //     console.log("decoder block is :", result)
        // }

        console.log(result)
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

        result = JSON.parse(result.toString());
        return result
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        return error.message

    }
}



exports.query = query
