import { promises as fs } from 'fs';
/**
 * Checks if a file exists at the given path with matching data
 * @param {string} filePath - Full path to the file
 * @param {any} data - Data to compare against file content
 * @returns {Promise<boolean>} - True if file exists and data matches
 */
export async function checkFileWithData(
  filePath: string, 
  dataToCheck: any, 
  propToCheck: string,
  isReturnData: boolean
): Promise<boolean | any> {
  try {
    // 1. Check if file exists
    await fs.access(filePath);
    
    // 2. Read file content
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    // 3. Compare stringified data
    const currentData = JSON.parse(fileContent);
    
    
    if (currentData[propToCheck] === dataToCheck[propToCheck]) {
      if (isReturnData === true) {
        return currentData;
      }
      return true
    }

    return false

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist
      return false;
    }
    throw error; // Re-throw other errors
  }
}