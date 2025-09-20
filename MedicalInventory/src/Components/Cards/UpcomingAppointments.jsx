import React, { useState, useEffect } from "react";
import { Button, Modal, message } from "antd";

export default function UpcomingAppointments({ open, onClose, appointments = [], onDetails, onCancel }) {
  const [localAppointments, setLocalAppointments] = useState([]);
  const [cancelingApp, setCancelingApp] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // sync whenever parent appointments change
  useEffect(() => {
    setLocalAppointments(appointments);
  }, [appointments]);

  if (!open) return null;

  const showCancelConfirm = (app) => {
    setCancelingApp(app);
    setConfirmVisible(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelingApp) return;

    setLoading(true);
    try {
      const res = await fetch(`https://my-backend-ex0j.onrender.com/api/appointments/${cancelingApp.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        message.success("Appointment cancelled successfully");

        // ✅ remove appointment locally
        setLocalAppointments((prev) => prev.filter((a) => a.id !== cancelingApp.id));

        // notify parent if needed
        if (onCancel) onCancel(cancelingApp);
      } else {
        message.error(data.error || "Failed to cancel appointment");
      }
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      message.error("Server error while cancelling appointment");
    } finally {
      setLoading(false);
      setConfirmVisible(false);
      setCancelingApp(null);
    }
  };

  const handleCloseConfirm = () => {
    setConfirmVisible(false);
    setCancelingApp(null);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-[#00000066]">
      <div className="w-[720px] max-h-[80vh] overflow-auto bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Upcoming Appointments</h2>
          <div className="flex gap-2 items-center">
            <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
              Close
            </button>
          </div>
        </div>

        {localAppointments.length === 0 ? (
          <p className="text-gray-500">No upcoming appointments.</p>
        ) : (
          <div className="space-y-4">
            {localAppointments.map((app) => (
              <div key={app.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 font-semibold">
                    {app.avatar || app.doctor?.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <div className="font-semibold">{app.doctor}</div>
                    <div className="text-sm text-gray-500">
                      {app.department} {app.building_name} • {app.room_number}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{app.notes}</div>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <div className="text-sm font-semibold text-blue-600">{app.appointment_date}</div>
                  <div className="text-xs text-gray-500">{app.appointment_time}</div>
                  <div className="mt-2 flex gap-2">
                    <Button size="small" onClick={() => onDetails && onDetails(app)}>
                      Details
                    </Button>
                    <Button size="small" type="primary" danger onClick={() => showCancelConfirm(app)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          title="Confirm cancellation"
          open={confirmVisible}
          onCancel={handleCloseConfirm}
          confirmLoading={loading}
          footer={[
            <Button key="back" onClick={handleCloseConfirm} disabled={loading}>
              Keep appointment
            </Button>,
            <Button key="confirm" type="primary" danger loading={loading} onClick={handleConfirmCancel}>
              Confirm cancel
            </Button>,
          ]}
        >
          {cancelingApp ? (
            <div className="space-y-2">
              <p className="font-semibold">
                {cancelingApp.doctor} — {cancelingApp.department}
              </p>
              <p className="text-sm text-gray-600">
                When:{" "}
                <span className="font-medium">
                  {cancelingApp.appointment_date} at {cancelingApp.appointment_time}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Location: {cancelingApp.department} • {cancelingApp.building_name} • {cancelingApp.room_number}
              </p>
              {cancelingApp.notes && <p className="text-sm text-gray-600">Notes: {cancelingApp.notes}</p>}
              <p className="text-sm text-red-600">
                Are you sure you want to cancel this appointment? This action may not be reversible.
              </p>
            </div>
          ) : (
            <p>No appointment selected.</p>
          )}
        </Modal>
      </div>
    </div>
  );
}
