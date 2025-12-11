import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Nav from "./Nav";
import "./Home.css";

function MyLibrary() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    axios
      .get("http://localhost:5000/purchased-books", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setBooks(res.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        } else {
          console.error("Failed to fetch purchased books", err.response?.data || err.message);
          setLoading(false);
        }
      });
  }, [navigate]);

  return (
    <>
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
          <h1 style={{ color: "#dbae32", marginBottom: "10px" }}>My Library</h1>
          <p style={{ color: "#ccc", marginBottom: "30px" }}>
            Books you have purchased and can download anytime
          </p>
        </div>
        <div className="home-container">
          <div className="book-grid">
            {loading ? (
              <div style={{ width: "100%", textAlign: "center", color: "#dbae32" }}>
                <p>Loading your library...</p>
              </div>
            ) : books.length === 0 ? (
              <div style={{ width: "100%", textAlign: "center", color: "#ccc" }}>
                <p>You haven't purchased any books yet.</p>
                <p style={{ marginTop: "10px" }}>
                  <a href="/" style={{ color: "#dbae32", textDecoration: "underline" }}>
                    Browse books
                  </a>{" "}
                  to start building your library!
                </p>
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
                  <p style={{ color: "#dbae32", fontSize: "14px" }}>
                    {book.category}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/view/${book._id}`);
                    }}
                    style={{
                      marginTop: "8px",
                      padding: "6px 12px",
                      backgroundColor: "#dbae32",
                      color: "black",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    View & Download
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default MyLibrary;

