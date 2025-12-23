const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function analyseDataset(file) {
  const formData = new FormData();
  formData.append("file", file);

  console.log("API:", API_BASE_URL);

  const response = await fetch(`${API_BASE_URL}/api/analyse`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Analysis failed");
  }

  return await response.json();
}
