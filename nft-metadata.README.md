## Prepare NFT & NFT Metadata
- ### CIS2 NFT & Metadata Standards
    - CIS Standard for [Token Metadata](https://proposals.concordium.software/CIS/cis-2.html#token-metadata-json). Also have a look at [Sample for NFT metadata json](https://proposals.concordium.software/CIS/cis-2.html#example-token-metadata-non-fungible)
- ### [IPFS](https://ipfs.io/)
    - #### IPFS UI
        - ##### [Install IPFS Desktop APP](https://docs.ipfs.tech/install/ipfs-desktop/)
        - ##### Prepare NFT Image
            - Click on files tab on the left side and upload any image [file to IPFS](https://docs.ipfs.io/basics/desktop-app/#add-local-files). For a sample you can use [this image](./sample-artifacts/nft.jpg).
            - Notice that you can copy / share the file url from this [interface](https://github.com/ipfs/ipfs-webui/blob/main/docs/screenshots/ipfs-webui-files.png) on the [IPFS web UI](http://localhost:5001/webui)
            - The final uploaded url should look something like this [https://ipfs.io/ipfs/QmV5REE3HJRLTHdmqG18Wc5PBF3Nc9W5dQL4Rp7MxBsx8q?filename=nft.jpg](https://ipfs.io/ipfs/QmV5REE3HJRLTHdmqG18Wc5PBF3Nc9W5dQL4Rp7MxBsx8q?filename=nft.jpg)
        - ##### Prepare NFT Metadata
            - According to CIS Standards the metadata should be a [json file in the particular format](https://proposals.concordium.software/CIS/cis-2.html#token-metadata-json). See an [example for NFT's](https://proposals.concordium.software/CIS/cis-2.html#example-token-metadata-non-fungible)
            - For this sample you can use the [metadata file](./sample-artifacts/nft-metadata.json)
            - Upload the metadata file to the IPFS node using the same steps that were taken to upload the NFT image and copy the Metadata Url. It should be something like this. [https://ipfs.io/ipfs/QmdiX58nByHsFdAfJKL42wj6hPSQHdSSjDhwaJx2Tv5X3E?filename=nft-metadata.json](https://ipfs.io/ipfs/QmdiX58nByHsFdAfJKL42wj6hPSQHdSSjDhwaJx2Tv5X3E?filename=nft-metadata.json)
        - ##### [Using a pinning service](https://docs.ipfs.tech/how-to/work-with-pinning-services/#use-an-existing-pinning-service)
    - #### IPFS CLI
        - #### [Install](https://docs.ipfs.tech/install/command-line/#system-requirements) IPFS daemon
        - The `<IPFS IP ADDRESS>` part in the commands below referrer to `127.0.0.1`. If you are running the IPFS daemon locally you can skip the `--api` argument completely
        - #### Add NFT image to IPFS
            ##### Command
            ```bash
            ipfs add ./sample-artifacts/token-metadata/nft_00000001.jpg
            ```
        - Add NFT Metadata to IPFS
            ##### Command
            ```bash
            ipfs add ./sample-artifacts/token-metadata/nft_00000001_metadata.json
            ```
        - Get URLS
            - To get an HTTP url for the files you can directly use the format `https://ipfs.io/ipfs/<CID>`.
            
                [Read more about this](https://docs.ipfs.tech/concepts/ipfs-gateway/#ipfs-gateway). Basically `ipfs.io` is the gateway that we are using.

                So the Urls would be : 
            
                - NFT Image : https://ipfs.io/ipfs/QmV5REE3HJRLTHdmqG18Wc5PBF3Nc9W5dQL4Rp7MxBsx8q
                - Metadata JSON : https://ipfs.io/ipfs/QmdiX58nByHsFdAfJKL42wj6hPSQHdSSjDhwaJx2Tv5X3E
        - [Using Pinning Service](https://docs.ipfs.tech/how-to/work-with-pinning-services/)
            - First of all [Why should we pin?](https://docs.pinata.cloud/faq#so-why-should-i-pin-my-content-with-pinata)
            - [Create a Pinata Account & Get JWT token](https://docs.pinata.cloud/pinata-api/pinning-services-api#pinning-services-api)
            - lets save the pinata JWT in ENV variable
                ```bash
                export JWT=<YOUR_JWT_TOKEN>
                ```
            - Add pinata service
                ```bash
                ipfs pin remote service add pinata https://api.pinata.cloud/psa $JWT
                ```
            - Pin the files
                ```
                ipfs pin remote add --service=pinata --name=nft.jpg QmV5REE3HJRLTHdmqG18Wc5PBF3Nc9W5dQL4Rp7MxBsx8q
                ipfs pin remote add --service=pinata --name=nft-metadata.json QmdiX58nByHsFdAfJKL42wj6hPSQHdSSjDhwaJx2Tv5X3E
                ```
- ### Using Pinata CLI
    - [Create a Pinata Account & Get JWT token](https://docs.pinata.cloud/pinata-api/pinning-services-api#pinning-services-api)
    - Lets save the pinata JWT in ENV variable
        ```bash
        export JWT=<YOUR_JWT_TOKEN>
        ```
    - Install CLI
        - Install [Node & NPM](https://nodejs.dev/learn/how-to-install-nodejs)
        - Install CLI
            ```bash
            npm i -g pinata-upload-cli
            ```
    - Configure the cli
        ```bash
        pinata-cli -a $JWT
        ```
    - Upload files
        ```
        pinata-cli -u ./sample-artifacts/nft.jpg
        pinata-cli -u ./sample-artifacts/nft-metadata.json
        ```
- ### [Pinata UI](https://docs.pinata.cloud/nfts#how-to-upload-your-asset-with-pinata)
    Go to the Pin Manager, click the upload button, choose a file, and upload your file. When the upload is complete, you'll see your file in the grid and can copy the IPFS CID (the string of characters that starts with "Qm"). You'll need this CID later, so keep it handy. You can also come back to the Pin Manage page and copy it again at any time.
