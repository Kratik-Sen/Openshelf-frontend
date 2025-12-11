import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import axios from "axios";
import "./PdfViewer.css";
import Nav from "./Nav";
import "./Navbar.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function PdfViewer() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1);
  const [isOwner, setIsOwner] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateCategory, setUpdateCategory] = useState("");
  const [updatePdf, setUpdatePdf] = useState(null);
  const [updateCoverImage, setUpdateCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const navigate = useNavigate();

  const faqs = [
    {
      question: "Explain The Meaning Of The Statement 'Electric Charge Of A Body Is Quantised'.",
      answer: "Quantisation of electric charge means that the charge on any body is always an integral multiple of the elementary charge (e = 1.6 × 10^-19 C). This means charges cannot exist in fractional amounts of the elementary charge. For example, a body can have a charge of +e, -e, +2e, -2e, etc., but never +0.5e or -1.3e."
    },
    {
      question: "Why Can One Ignore Quantisation Of Electric Charge When Dealing With Macroscopic I.E., Large Scale Charges?",
      answer: "For macroscopic or large-scale charges, the elementary charge (e = 1.6 × 10^-19 C) is extremely small compared to the total charge. When dealing with charges of the order of microcoulombs or larger, the discrete nature of charge becomes negligible. The large number of elementary charges makes the charge appear continuous, similar to how water appears continuous even though it's made of discrete molecules."
    }
  ];

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 395) setScale(0.5);
      else if (width < 495) setScale(0.6);
      else if (width < 595) setScale(0.7);
      else if (width < 768) setScale(0.8);
      else if (width < 1024) setScale(0.9);
      else setScale(1.1);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetch(`https://openshelf-backend.onrender.com/get-files`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        const match = data.data.find((item) => item._id === id);
        setBook(match);
        if (match) {
          setUpdateTitle(match.title);
          setUpdateCategory(match.category || "");
          const user = JSON.parse(localStorage.getItem("user") || "null");
          if (user && match.owner === user.id) setIsOwner(true);
          // Check payment status
          checkPaymentStatus(match._id, token);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch book", err);
      });
  }, [id, navigate]);

  const checkPaymentStatus = async (bookId, token) => {
    try {
      const res = await axios.get(`https://openshelf-backend.onrender.com/payment/status/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHasPaid(res.data.hasPaid || isOwner);
    } catch (err) {
      console.error("Payment status check failed", err);
    }
  };

  const handleDownload = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // If already paid or owner, download directly
    if (hasPaid || isOwner) {
      downloadPdf();
      return;
    }

    try {
      // Create Razorpay order
      const orderRes = await axios.post(
        "https://openshelf-backend.onrender.com/payment/create-order",
        { bookId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (orderRes.data.status === "ok") {
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_1234567890",
          amount: orderRes.data.order.amount,
          currency: orderRes.data.order.currency,
          name: "PDF Download",
          description: `Download ${book?.title || "PDF"}`,
          order_id: orderRes.data.order.id,
          handler: async function (response) {
            try {
              // Verify payment
              const verifyRes = await axios.post(
                "https://openshelf-backend.onrender.com/payment/verify",
                {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  bookId: id,
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              if (verifyRes.data.status === "ok") {
                setHasPaid(true);
                // Download PDF
                downloadPdf();
              } else {
                alert("Payment verification failed");
              }
            } catch (err) {
              console.error("Payment verification error", err);
              alert("Payment verification failed");
            }
          },
          prefill: {
            name: JSON.parse(localStorage.getItem("user") || "{}").name || "",
            email: JSON.parse(localStorage.getItem("user") || "{}").email || "",
          },
          theme: {
            color: "#dbae32",
          },
        };

        if (window.Razorpay) {
          const razorpay = new window.Razorpay(options);
          razorpay.open();
        } else {
          alert("Razorpay SDK not loaded. Please refresh the page.");
        }
      }
    } catch (err) {
      if (err.response?.data?.message === "Already purchased") {
        downloadPdf();
      } else {
        console.error("Payment initialization error", err);
        const errorMsg = err.response?.data?.message || "Failed to initialize payment. Please check your Razorpay configuration.";
        alert(errorMsg);
      }
    }
  };

  const downloadPdf = () => {
    const token = localStorage.getItem("token");
    fetch(`https://openshelf-backend.onrender.com/files/${id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${book?.title || "book"}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch((err) => {
        console.error("Download failed", err);
        alert("Download failed");
      });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    if (updateTitle) formData.append("title", updateTitle);
    if (updateCategory) formData.append("category", updateCategory);
    if (updatePdf) formData.append("file", updatePdf);
    if (updateCoverImage) formData.append("coverImage", updateCoverImage);

    try {
      const res = await axios.put(`https://openshelf-backend.onrender.com/files/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data.status === "ok") {
        setBook(res.data.data);
        setShowUpdateForm(false);
        alert("Book updated successfully!");
        window.location.reload();
      }
    } catch (err) {
      console.error("Update failed", err);
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  if (!book) {
    return (
      <div style={{ backgroundColor: "black", color: "white", minHeight: "100vh" }}>
        <Nav />
        <h3 style={{ textAlign: "center", padding: "50px" }}>Loading...</h3>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "black", color: "white", minHeight: "100vh" }}>
      <Nav />
      <div className="pdf-viewer-container">
        <button className="back-button" onClick={() => navigate("/")}>
          ← BACK
        </button>

        <div className="pdf-viewer-content">
          {/* Left Sidebar */}
          <div className="book-details-sidebar">
            <div className="book-cover-section">
              <button 
                className="view-pdf-button-top" 
                onClick={() => document.querySelector('.pdf-preview-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                VIEW PDF
              </button>
              <img src={book.coverImage} alt={book.title} className="book-cover-img" />
              <div className="book-info-list">
                <p><strong>Book Language:</strong> ENGLISH</p>
                <p><strong>Total Pages:</strong> {numPages || "N/A"} Pages</p>
                <p><strong>Size:</strong> 10MB</p>
                <p><strong>PDF Quality:</strong> GOOD</p>
              </div>
              <div className="book-meta-info">
                <p><strong>Book Authors:</strong> {book.title.split(' ')[0] || "Author"}</p>
                <p><strong>Categories:</strong> {book.category || "General"}</p>
                <p><strong>Publication Years:</strong> 2024</p>
                <p><strong>Number of Pages:</strong> {numPages || "N/A"}</p>
                <p><strong>Language:</strong> ENGLISH</p>
                <p><strong>Publisher:</strong> PDF Library</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="main-content-area">
            <h1 className="book-main-title">{book.title}</h1>
            <p className="book-description">
              This book is a valuable resource for students and professionals. It contains comprehensive 
              content that has been carefully curated to provide the best learning experience. Whether 
              you're preparing for exams or looking to expand your knowledge, this book offers detailed 
              explanations and practical examples.
            </p>

            <div className="featured-fact">
              <strong>Featured Fact:</strong> Our platform is dedicated to providing high-quality educational 
              resources. All books are carefully reviewed to ensure accuracy and relevance.
            </div>

            {/* Owner Controls - Above PDF Preview */}
            {isOwner && (
              <div className="owner-controls">
                <button onClick={() => setShowUpdateForm(!showUpdateForm)}>
                  {showUpdateForm ? "Cancel Update" : "Update Book"}
                </button>
                <button
                  onClick={async () => {
                    const token = localStorage.getItem("token");
                    if (window.confirm("Are you sure you want to delete this book?")) {
                      await fetch(`https://openshelf-backend.onrender.com/files/${id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      navigate("/");
                    }
                  }}
                >
                  Delete Book
                </button>
                {showUpdateForm && (
                  <form onSubmit={handleUpdate} className="update-form">
                    <input
                      type="text"
                      placeholder="Book Title"
                      value={updateTitle}
                      onChange={(e) => setUpdateTitle(e.target.value)}
                    />
                    <select
                      value={updateCategory}
                      onChange={(e) => setUpdateCategory(e.target.value)}
                    >
                      <option value="">Select Category</option>
                      <option value="Academic & Educational">Academic & Educational</option>
                      <option value="Fiction">Fiction</option>
                      <option value="Non-Fiction">Non-Fiction</option>
                      <option value="Comics & Graphic Novels">Comics & Graphic Novels</option>
                      <option value="Religious & Spiritual">Religious & Spiritual</option>
                      <option value="Career & Skill Development">Career & Skill Development</option>
                      <option value="Self Help">Self Help</option>
                      <option value="Others">Others</option>
                    </select>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setUpdatePdf(e.target.files[0])}
                    />
                    <label>Update PDF (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setUpdateCoverImage(e.target.files[0])}
                    />
                    <label>Update Cover Image (optional)</label>
                    <button type="submit" disabled={loading}>
                      {loading ? "Updating..." : "Update"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* PDF Preview Section - At Top - Visible to ALL users */}
            <div className="pdf-preview-section">
              <h3>PDF Preview</h3>
              <Document
                className="Document"
                file={{
                  url: `https://openshelf-backend.onrender.com/files/${id}/pdf`,
                  httpHeaders: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                }}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(err) => console.error("PDF load error:", err)}
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    scale={scale}
                  />
                ))}
              </Document>
              {!hasPaid && !isOwner && (
                <div className="preview-note">
                  <p>💡 You can view the PDF here for free. Pay ₹9 to download it to your device.</p>
                </div>
              )}
            </div>

            {/* Download Button - Below PDF Preview - Hidden for owner */}
            {!isOwner && (
              <div className="download-section">
                <button className="download-pdf-button" onClick={handleDownload}>
                  {hasPaid ? "DOWNLOAD PDF" : "DOWNLOAD PDF (₹9)"}
                </button>
                <p className="download-note">
                  For Removal of any book links. Contact us : contact.domain@gmail.com. 
                  Check out Disclaimer Page for More Information.
                </p>
              </div>
            )}

            {/* Key Features - Below Download Button */}
            <div className="key-features">
              <h3>Key Features of this Book:</h3>
              <ul>
                <li>Comprehensive content covering all important topics</li>
                <li>High-quality PDF format for easy reading</li>
                <li>Well-organized chapters and sections</li>
                <li>Clear and detailed explanations</li>
              </ul>
            </div>

            {/* FAQ Section - Below Key Features with Dropdown */}
            <div className="faq-section">
              <h3>FAQ'S ↓</h3>
              {faqs.map((faq, index) => (
                <div key={index} className="faq-item">
                  <div 
                    className="faq-question" 
                    onClick={() => toggleFaq(index)}
                  >
                    <p>{faq.question}</p>
                    <span className="faq-arrow">{openFaqIndex === index ? "▲" : "▼"}</span>
                  </div>
                  {openFaqIndex === index && (
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PdfViewer;
