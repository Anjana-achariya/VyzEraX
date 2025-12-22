import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./layout/Layout";
import Home from "./pages/Home";
import Statistics from "./pages/Statistics";
import Dashboard from "./pages/Dashboard";
import Summarize from "./pages/Summarize";
import Export from "./pages/Export";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
  <Route index element={<Home />} />
  <Route path="statistics" element={<Statistics />} />
  <Route path="dashboard" element={<Dashboard />} />        {/* Stat Analysis */}

  <Route path="summarize" element={<Summarize />} />
  <Route path="export" element={<Export />} />
</Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
