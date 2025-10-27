import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Landing from "./Landing";

const Index = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole");

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    if (userRole) {
      switch(userRole) {
        case "provider":
          navigate("/provider");
          break;
        case "patient":
          navigate("/patient");
          break;
        case "admin":
          navigate("/admin");
          break;
      }
    }
  }, [userRole, navigate]);

  return <Landing />;
};

export default Index;
