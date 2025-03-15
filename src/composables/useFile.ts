function useFile() {
  function readFileAsDataURL(file: File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  async function getDataFromFile(file: File | null) {
    if (!file) return null;
    try {
      const dataURL = await readFileAsDataURL(file);
      return { dataURL, file };
    } catch (err) {
      console.error("❌ Failed to handle pasted image:", err);
      return null;
    }
  }

  return { getDataFromFile, readFileAsDataURL };
}

export default useFile;
