# CS30-2-2025-S1

1. Create a folder (call it **extension-folder**). 
2. Copy every file but **server.js** into this folder. 
3. Download and install **NodeJS** (https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi)
4. Make sure that you have the installation ready by running the following commands: **npm --version** and **node --version**.
5. For windows users if you get an OpenSSL config error or something, open **Powershell** and run the following command: **$env:OPENSSL_CONF = ''**
6. Next you will need to install the packages that are needed. The command is **npm install mysql2 cors express**. 3 packages needed **mysql2 cors express**. 
7. After that is done, please run the following server in from the directory where **server.js** file is: node server.js.
8. This should have the server up and running. 
9. When the server starts, you will see a lot of things happening on the terminal (dont worry about it). 
10. The credentials for the database are in the server.js file. 
11. Use any SQL IDE (like Workbench etc) and login. You should be able to see the entries instantly. 
