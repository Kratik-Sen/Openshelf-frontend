import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Nav from "./Nav";
import "./Home.css";

function Home() {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const marqueeRef = useRef(null);

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
        setBooks(res.data.data); //http://localhost:3000
        setFilteredBooks(res.data.data);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        } else {
          console.error("Failed to fetch books", err.response?.data || err.message);
        }
      });
  }, [navigate]);

  const handleMouseEnter = () => {
    marqueeRef.current?.stop();
  };

  const handleMouseLeave = () => {
    marqueeRef.current?.start();
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    if (query === "") {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter(
        (book) =>
          book.title?.toLowerCase().includes(query) ||
          book.category?.toLowerCase().includes(query)
      );
      setFilteredBooks(filtered);
    }
  };

  const categories = [
    "Academic & Educational",
    "Fiction",
    "Non-Fiction",
    "Comics & Graphic Novels",
    "Religious & Spiritual",
    "Career & Skill Development",
    "Self Help",
    "Others",
  ];

  return (
    <>
      {/* Main content starts here */}
      <div className="home" style={{ backgroundColor: "black", color: "white", minHeight: "100vh" }}>
        <Nav />
        <marquee
          className="topmarquee"
          direction="left"
          height="70px"
          scrollamount="30"
        >
          ﮩ٨ـﮩﮩ٨ـ♡ﮩ٨ـﮩﮩ٨ـRead , Download and Upload books ﮩ٨ـﮩﮩ٨ـ♡ﮩ٨ـﮩﮩ٨ـ
        </marquee>
        {/* Search Bar */}
        <div className="search-container">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search books by title or category..."
              value={searchQuery}
              onChange={handleSearch}
              className="search-input"
            />
            {searchQuery && (
              <button
                className="clear-search"
                onClick={() => {
                  setSearchQuery("");
                  setFilteredBooks(books);
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
        {/* Top horizontal category buttons (always visible) */}
        <div className="btnBOX">
          {" "}
          <div className="top-category-bar">
            <span>Category:</span>
            {categories.map((cat) => (
              <button key={cat} onClick={() => navigate(`/category/${cat}`)}>
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="home-container">
          {/* Book grid start */}
          <div className="book-grid">
            {filteredBooks.length === 0 ? (
              <div className="no-results">
                <p>No books found matching "{searchQuery}"</p>
              </div>
            ) : (
              filteredBooks.map((book) => (
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
                  {JSON.parse(localStorage.getItem("user") || "null")?.id ===
                    book.owner && (
                    <button
                      className="manage-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/view/${book._id}`);
                      }}
                    >
                      Manage
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Category Marquee (hidden on small screens) */}
          <div className="cate-box desktop-only">
            <h2>Books Category↓</h2>
            <marquee
              ref={marqueeRef}
              direction="up"
              scrollAmount="18"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className="category-buttons">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => navigate(`/category/${cat}`)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </marquee>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
