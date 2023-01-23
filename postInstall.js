/*
    This package can be installed from GitHub and from NPM.

    If installed via NPM the dist folder will contain the already built artifacts.
    If installed via GithHub the dist folder is EMPTY, so we have to install dependencies and build the project.

*/

const { exec } = require('child_process');
const fs = require("fs");
const dir = './dist'

//Does the dist directory NOT exist?
if (fs.existsSync(dir) === false) {
    run('npm install');
    run('npm run build');
}


function run(command) {


    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`error: ${error.message}`);
            return;
        }

        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }

        console.log(`stdout:\n${stdout}`);
    });
}