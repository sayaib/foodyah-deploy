import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to run a seed file
const runSeedFile = (seedFile) => {
  const seedFilePath = path.join(__dirname, '..', 'utils', seedFile);
  console.log(`Running seed file: ${seedFilePath}`);
  
  exec(`node ${seedFilePath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing ${seedFile}: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`${seedFile} stderr: ${stderr}`);
      return;
    }
    
    console.log(`${seedFile} stdout: ${stdout}`);
  });
};

// Run the tax services seed file
runSeedFile('seedTaxServices.js');

console.log('Seeding process initiated. Check logs for results.');