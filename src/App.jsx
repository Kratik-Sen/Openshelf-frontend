import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AdminPage from "./pages/AdminPage";
import PdfViewer from "./pages/PdfViewer";
import CategoryPage from "./pages/CategoryPage"; // New
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import About from "./pages/About";
import MyLibrary from "./pages/MyLibrary";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/view/:id" element={<PdfViewer />} />
      <Route path="/category/:category" element={<CategoryPage />} /> {/* New */}
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/my-library" element={<MyLibrary />} />
    </Routes>
  );
}

export default App;
