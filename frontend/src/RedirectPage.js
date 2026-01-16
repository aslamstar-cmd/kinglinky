import { useEffect } from "react";
import { useParams } from "react-router-dom";

const RedirectPage = () => {
  const { code } = useParams();

  useEffect(() => {
    // Unga Backend Render URL-ai inga podunga
    const backendUrl = "https://kinglinky-backend.onrender.com"; 
    
    if (code) {
      // Direct-ah backend-oda step1 route-ku anupuvom
      window.location.href = `${backendUrl}/step1/${code}`;
    }
  }, [code]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Redirecting... Please wait</h2>
    </div>
  );
};

export default RedirectPage;