import { Modal, Descriptions, Tag } from "antd";

function AppointmentDetails({ open, onClose, appointment }) {
  if (!appointment) return null;

  const statusColors = {
    Confirmed: "green",
    Pending: "gold",
    Cancelled: "red",
    Completed: "blue",
  };

  return (
    <Modal
      title="Appointment Details"
      open={open}
      onCancel={onClose}
      footer={null}
    >
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Doctor">Dr. {appointment.doctor}</Descriptions.Item>
        <Descriptions.Item label="Department">{appointment.dept}</Descriptions.Item>
        <Descriptions.Item label="Location"> {appointment.building_name} • {appointment.room_number}</Descriptions.Item>
        <Descriptions.Item label="Date">{appointment.date}</Descriptions.Item>
        <Descriptions.Item label="Time">{appointment.time}</Descriptions.Item>
        <Descriptions.Item label="Notes">{appointment.notes || "—"}</Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={statusColors[appointment.status] || "default"}>
            {appointment.status}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}

export default AppointmentDetails;
