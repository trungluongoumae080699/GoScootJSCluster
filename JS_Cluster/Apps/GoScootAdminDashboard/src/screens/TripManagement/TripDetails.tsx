// // src/pages/TripDetails.tsx
// import Sidebar from "./components/Sidebar";
// import Header from "./components/Header";
// import { FaRegClock } from "react-icons/fa";
// import { FaLocationDot } from "react-icons/fa6";
// import { GoDotFill } from "react-icons/go";
// import "./TripDetails.css";
// import { useEffect, useState } from "react";
// import { tripApi } from "./services/apiClient";
// import { Trip } from "@trungthao/admin_dashboard_dto";
// import TripMap from "./components/tripDetails/TripMap";
// import { useParams } from "react-router-dom";
// import { calculateDistance, calculateDuration, convertLocationName, formatDate, formatDistance } from "./utlities/convert";

// export default function TripDetails() {
//   const { bikeId, tripId } = useParams<{ bikeId: string; tripId: string }>(); // Example bike ID
//   const [trip, setTrip] = useState<Trip | null>(null);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);

//   const [fromLocationName, setFromLocationName] =
//     useState<string>("");
//   const [toLocationName, setToLocationName] = useState<string>("");

//   const [startLocation, setStartLocation] = useState<{
//     longitude: number;
//     latitude: number;
//   } | null>({
//     longitude: 106.660172,
//     latitude: 10.762622,
//   });

//   useEffect(() => {
//     const fetchTripData = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         const response = await tripApi.getTripsByBike(bikeId || "");
//         let tripData = response.trips.find((t) => t.id === tripId) as Trip;
//         if (!tripData && response.totalPages > 1) {
//           // Search remaining pages
//           for (let page = 2; page <= response.totalPages && !tripData; page++) {
//             const pageResponse = await tripApi.getTripsByBike(bikeId || "", {
//               page,
//             });
//             tripData = pageResponse.trips.find((t) => t.id === tripId) as Trip;
//           }
//         }
//         setTrip(tripData);
//       } catch (err) {
//         console.error("Failed to fetch trip data:", err);
//         setError(
//           err instanceof Error ? err.message : "Failed to load trip data"
//         );
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchTripData();
//   }, [tripId, bikeId]);

//   useEffect(() => {
//     if (!startLocation) return;

//     convertLocationName(startLocation?.longitude!, startLocation?.latitude!)
//       .then(setFromLocationName)
//       .catch(() => setFromLocationName("Unknown location"));
//     convertLocationName(trip?.trip_end_long!, trip?.trip_end_lat!)
//       .then(setToLocationName)
//       .catch(() => setToLocationName("Unknown location"));
//   }, [startLocation, trip]);

//   if (loading) {
//     return (
//       <div className="bike-details-container">
//         <Header title="Trip Details" />
//         <div className="main-content">
//           <Sidebar />
//           <div
//             className="content-area"
//             style={{ padding: "20px", textAlign: "center" }}
//           >
//             <p>Loading trip details...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bike-details-container">
//         <Header title="Trip Details" />
//         <div className="main-content">
//           <Sidebar />
//           <div className="content-area" style={{ padding: "20px" }}>
//             <div
//               className="error-message"
//               style={{
//                 color: "red",
//                 padding: "20px",
//                 background: "#fee",
//                 borderRadius: "8px",
//               }}
//             >
//               <h3>Error Loading Trip Data</h3>
//               <p>{error}</p>
//               <button
//                 onClick={() => window.location.reload()}
//                 style={{ marginTop: "10px", padding: "8px 16px" }}
//               >
//                 Retry
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!trip) {
//     return (
//       <div className="bike-details-container">
//         <Header title="Trip Details" />
//         <div className="main-content">
//           <Sidebar />
//           <div className="content-area" style={{ padding: "20px" }}>
//             <p>Trip not found</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bike-details-container">
//       {/* Assuming Header and Sidebar are rendered outside this component or here */}
//       <Header title="Trip Details" />
//       <div className="main-content">
//         <Sidebar />
//         <div className="content-area">
//           <div className="trip-detail-content">
//             <div className="detail-header-card">
//               <div className="map-icon-container">
//                 {/* Using a placeholder div for the map icon image */}
//                 <img className="map-icon" src="/Map.png" alt="Trip Map"></img>
//               </div>
//               <div className="trip-info">
//                 <h2 className="vin">{trip.id}</h2>
//                 <p>Bike ID: {trip.bike_id}</p>
//                 <p>Customer ID: {trip.customer_id}</p>
//                 <p>
//                   Time: {formatDate(trip.trip_start_date!)} -{" "}
//                   {formatDate(trip.trip_end_date!)}
//                 </p>
//                 <p>From: {fromLocationName}</p>
//                 <p>To: {toLocationName}</p>
//               </div>
//             </div>

//             <div className="trip-statistics-section">
//               <div className="trip-statistic-card">
//                 <h3 className="statistic-title">Trip Statistic</h3>
//                 <div className="statistic-item location-stats">
//                   <div className="location-icon-group">
//                     <div className="location-icon">
//                       <GoDotFill size={24} />
//                     </div>
//                     <div className="location-icon">
//                       <FaLocationDot style={{ margin: 3 }} />
//                     </div>
//                   </div>
//                   <div className="location-text-group">
//                     <p>{fromLocationName}</p>
//                     <p>{toLocationName}</p>
//                   </div>
//                   <p className="distance">
//                     {formatDistance(
//                       calculateDistance(
//                         startLocation?.longitude!,
//                         startLocation?.latitude!,
//                         trip.trip_end_long!,
//                         trip.trip_end_lat!
//                       )
//                     )}
//                   </p>
//                 </div>

//                 <div className="statistic-item duration-stats">
//                   <div className="duration-icon">
//                     <FaRegClock size={30} />
//                   </div>
//                   <p>
//                     {calculateDuration(
//                       trip.trip_start_date!,
//                       trip.trip_end_date!
//                     )}
//                   </p>
//                 </div>
//               </div>

//               <div className="map-image-container">
//                 {/* Using an actual image tag for the map or a placeholder div */}
//                 <TripMap
//                   routeStart={
//                     startLocation
//                       ? startLocation
//                       : { longitude: 106.660172, latitude: 10.762622 }
//                   }
//                   routeEnd={{
//                     longitude: trip.trip_end_long!,
//                     latitude: trip.trip_end_lat!,
//                   }}
//                 />
//                 {/*  */}
//               </div>
//             </div>

//             {/* You would have the Alert and Logout content areas here if they were part of the main page content */}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
