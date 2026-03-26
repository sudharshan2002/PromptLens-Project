import { useState, useEffect } from "react";
import { RouterProvider } from "react-router";
import { LoadingScreen } from "./components/LoadingScreen";
import { router } from "./routes";

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 2400ms gives enough time for staggered entry to finish and rest before exiting
    const timer = setTimeout(() => setLoading(false), 2400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <LoadingScreen visible={loading} />
      <div>
        <RouterProvider router={router} />
      </div>
    </>
  );
}
