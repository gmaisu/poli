You need to install NodeJs tool to run scripts

[//]: #

      https://nodejs.org/en/download


      To check if it's properly installed, run command in terminal:

      npm -v

You need to install Git to clone repository

[//]: #

      https://git-scm.com/downloads


      run command in terminal:

      git clone https://github.com/gmaisu/poli-presale.git

After installation and cloning, you have to run next command in project directory

[//]: #

      npm i

Now you have to replace parameters

1. Find .env file
2. You will find next parameters:

[//]: #

      OWNER_PRIVATE_KEY=

      For example,
        Private key is 63760e0ff05d32357ad55808e63c342bcaa2479fb8dcfbc95327b3cb3bbdd3a5

     Replace them like
        OWNER_PRIVATE_KEY=63760e0ff05d32357ad55808e63c342bcaa2479fb8dcfbc95327b3cb3bbdd3a5

3. To deploy smart contracts, run next command

[//]: #

      Test environment: npm run migrate:test

      Production enviroment: npm run migrate:prod

4. After deployment, you will know smart contract addresses

[//]: #

      Replace TOKEN_CONTRACT_ADDRESS parameter in .env file like

      TOKEN_CONTRACT_ADDRESS=0x8DDeD894729383044c2916AFc65ebD29A4A6FcE1

# AFTER PRESALE COMPLETION

1. Run script that distrubutes tokens to team wallets

[//]: #

      Test environment: npm run team:test

      Production enviroment: npm run team:prod

2. Run script that distrubutes tokens to partipicants

[//]: #

      Test environment: npm run partipicants:test

      Production enviroment: npm run partipicants:prod

You will see new created file named **team-distribution.csv**. You can see here all of 100 wallet addresses with private keys and received amounts

You will also see new created file named **partipicants-distribution.csv**. You can see here all of partipicants with data of funded and received amounts
