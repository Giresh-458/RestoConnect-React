import { useState } from "react";
import { Requests } from "./Requests";
import { Restaurant } from "./Restaurant";

export function RestaurantSubPage() {
  const [restSubPage, setRestSubPage] = useState("restaurants");

  return (
    <>
      <button onClick={() => setRestSubPage("requests")}>requests</button>
      <button onClick={() => setRestSubPage("restaurants")}>restaurants</button>

      {restSubPage === "requests" && <Requests />}
      {restSubPage === "restaurants" && <Restaurant />}
    </>
  );
}
