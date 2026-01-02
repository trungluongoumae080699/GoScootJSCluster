import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Bikes.css";
import { Bike, BikeStatus } from "@trungthao/admin_dashboard_dto";
import { useGlobalContext } from "../../context/GlobalContext";
import Pagination from "../../components/module/pagination";
import { useBikeListing } from "../../hooks/PageHooks/useBikeListing";
import { bikeApi } from "../../services/ApiClient/BikeApis";
import Input, { Option } from "../../components/module/Input";


const STATUS_OPTIONS: Option[] = [
  { value: "", label: "All Status" },
  { value: BikeStatus.IDLE, label: "Available" },
  { value: BikeStatus.INUSED, label: "Inused" },
  { value: BikeStatus.RESERVED, label: "Reserved" },
];

export default function Bikes() {
  const navigate = useNavigate();
  const globalContext = useGlobalContext()

  // ✅ shared state from context
  const {
    // state
    isLoading,
    displayList,
    totalCount,
    currentPage,
    // actions
    applyFilters, // use snapshot version
    resetFilter,
    goToPage,
    // filters
    filterPayload,
    setFilterPayload,
  } = useBikeListing(bikeApi.getBikes);

  useEffect(() => {
    applyFilters(); // fetch group 0 + set display list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleBikeClick = (bikeId: string) => navigate(`/bike/${bikeId}`);

  const getStatusStyle = (status: BikeStatus) => {
    switch (status) {
      case "Idle":
        return { background: "#d4edda", color: "#155724" };
      case "Inused":
        return { background: "#ffe4c4", color: "#856404" };
      case "Reserved":
        return { background: "#fff3cd", color: "#856404" };
      default:
        return { background: "#e2e3e5", color: "#383d41" };
    }
  };

  const getStatusLabel = (status: BikeStatus) => {
    switch (status) {
      case "Idle":
        return "Available";
      case "Inused":
        return "Inused";
      case "Reserved":
        return "Reserved";
      default:
        return status;
    }
  };

  return (
    <div className="bike-details-container">
      <div className="main-content">
        <div className="content-area bikes-content">
          {/* Stats */}

          {/* Pagination */}
          <div className="bikes-stats">
            <p>Total: {totalCount || 0}</p>
            <p>Displayed (on page): {displayList.length}</p>

            {isLoading && (
              <span className="background-loading-indicator">
                Loading...
              </span>
            )}
          </div>

          {/* Filters */}
          <div className="bikes-filters">
            <Input
              kind="input"
              type={"text"}
              value={filterPayload.search}
              placeHolder="Nhập xe bạn muốn tìm"
              label={"Tìm Kiếm"}
              onChange={
                (e) => setFilterPayload((p) => ({ ...p, search: e.target.value }))
              }
            >
            </Input>

            <Input
              kind="input"
              type={"text"}
              value={filterPayload.battery}
              placeHolder="Nhập lượng pin"
              label={"Dung Lượng Pin"}
              onChange={
                (e) => setFilterPayload((p) => ({ ...p, battery: e.target.value }))
              }
            >
            </Input>

            <Input
              kind="select"
              value={filterPayload.status}
              placeHolder="Chọn trạng thái"
              options={STATUS_OPTIONS}
              label={"Trạng Thái Hoạt Động"}
              onChange={
                (e) => setFilterPayload((p) => ({ ...p, status: e.target.value }))
              }
            >
            </Input>

           
            <div className="filter-dropdown">
              <span className="filter-icon">☰</span>
              <select
                value={filterPayload.status}
                onChange={(e) => setFilterPayload((p) => ({ ...p, status: e.target.value }))}
                className="filter-select"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button className="refresh-btn" onClick={applyFilters} disabled={isLoading} title="Apply filters & fetch group 0">
              ✅ Apply
            </button>
            <Pagination
              currentPage={currentPage}
              totalItems={totalCount}
              goToPage={goToPage}>
            </Pagination>
          </div>

          {/* Table */}
          <div className="bikes-table-container">
            <table className="bikes-table">
              <thead>
                <tr>
                  <th>Vin Number</th>
                  <th>Type</th>
                  <th>Current Battery</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayList.map((bike) => (
                  <tr
                    key={bike.id}
                    onClick={() => handleBikeClick(bike.id)}
                    className={bike.status === "Inused" ? "row-highlighted" : ""}
                  >
                    <td className="vin-cell">{bike.id}</td>
                    <td>{bike.name}</td>
                    <td>{bike.battery_status !== null ? `${bike.battery_status}%` : "N/A"}</td>
                    <td>
                      <span className="status-badge-table" style={getStatusStyle(bike.status as BikeStatus)}>
                        {getStatusLabel(bike.status as BikeStatus)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>


        </div>
      </div>
    </div>
  );
}