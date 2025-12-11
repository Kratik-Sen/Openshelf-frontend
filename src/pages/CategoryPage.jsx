import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Nav from "./Nav";
import "./Category.css";

const CategoryPage = () => {
  const { category } = useParams();
  const [books, setBooks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    axios
      .get("https://openshelf-backend.onrender.com/get-files", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const filtered = res.data.data.filter((book) => book.category === category);
        setBooks(filtered);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        } else {
          console.error("Failed to fetch category books", err.response?.data || err.message);
        }
      });
  }, [category, navigate]);

  return (
    <div className="home" style={{ backgroundColor: "black", color: "white", minHeight: "100vh" }}>
      <Nav />
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "left" }}>
          <button
            className="back-about-btn"
            onClick={() => navigate(-1)}
            style={{ marginBottom: "12px" }}
          >
            ← Back
          </button>
        </div>
        <h2 style={{ color: "#dbae32", margin: 0 }}>{category} Books</h2>
        <p style={{ color: "#ccc", marginTop: "10px" }}>
          Browse titles in {category}. Click any card to view details.
        </p>
      </div>
      <div className="book-grid">
        {books.length === 0 ? (
          <div style={{ width: "100%", textAlign: "center", color: "#ccc", padding: "20px" }}>
            <p>No books found in this category.</p>
            <Link to="/" style={{ color: "#dbae32", textDecoration: "underline" }}>
              Return to Home
            </Link>
          </div>
        ) : (
          books.map((book) => (
            <div
              className="book-card"
              key={book._id}
              onClick={() => navigate(`/view/${book._id}`)}
            >
              <img src={book.coverImage} alt={book.title} width={200} />
              <h5>{book.title}</h5>
              <p style={{ color: "#dbae32", fontSize: "14px" }}>{book.category}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
