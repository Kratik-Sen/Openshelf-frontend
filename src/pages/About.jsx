import React from 'react';
import Nav from './Nav';
import './About.css';

function About() {
  return (
    <div style={{ backgroundColor: "black", color: "white", minHeight: "100vh" }}>
      <Nav />
      <div className="about-container">
        <h1 className="about-title">About Us</h1>
        <div className="about-content">
          <p>
            Welcome to our platform — a digital space built for book lovers, learners, and knowledge seekers. 
            Our mission is to make reading easy, accessible, and enjoyable for everyone.
          </p>
          <p>
            On our website, users can upload books in PDF format along with cover images, and explore a growing 
            collection of books shared by readers from around the world. Whether you're a student, a professional, 
            or a casual reader, you'll find valuable content tailored to your interests.
          </p>
          <p>
            We believe that knowledge should be shared freely and responsibly. That's why we focus on creating a 
            safe, user-friendly environment where content is easy to access and enjoyable to read.
          </p>
          <p>
            Our goal is to build a community of readers who love learning, sharing, and growing together.
          </p>
          <p className="about-thanks">
            Thank you for being part of our journey. 📚✨
          </p>
        </div>
      </div>
    </div>
  );
}

export default About;