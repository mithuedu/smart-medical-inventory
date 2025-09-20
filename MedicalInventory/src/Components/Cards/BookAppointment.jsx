import { useState, useEffect } from "react";
import { Modal, Form, Input, DatePicker, TimePicker, Select, Button, message } from "antd";
import { useSelector } from "react-redux";

function BookAppointment({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [doctors, setDoctors] = useState([]);
  const userInfo = useSelector((state) => state.userinfo);

  // Fetch doctors from API
  useEffect(() => {
    fetch("https://my-backend-ex0j.onrender.com/api/doctors")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setDoctors(data.data);
      })
      .catch((err) => console.error("Error fetching doctors:", err));
  }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Map doctor id to full doctor object
      const selectedDoctor = doctors.find((d) => d.id === values.doctor);

      const appointmentData = {
        patientName: values.patientName,
        doctor: selectedDoctor.name,
        department: selectedDoctor.department,
        date: values.date.format("YYYY-MM-DD"),
        time: values.time.format("HH:mm"),
        notes: values.notes,
        email: userInfo.emailid,
        doctorid:selectedDoctor.id
      };

      await fetch("https://my-backend-ex0j.onrender.com/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentData),
      });

      message.success("Appointment booked successfully!");
      onSuccess?.(appointmentData);
      form.resetFields();
      onClose?.();
    } catch (err) {
      console.log("Validation or API error:", err);
      message.error("Failed to book appointment!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Book Appointment"
      open={open}
      onCancel={() => onClose?.()}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Patient Name"
          name="patientName"
          rules={[{ required: true, message: "Please enter your name" }]}
        >
          <Input placeholder="Enter full name" />
        </Form.Item>

        <Form.Item
          label="Doctor"
          name="doctor"
          rules={[{ required: true, message: "Please select a doctor" }]}
        >
          <Select
            placeholder="Select doctor"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            {doctors.map((doc) => (
              <Select.Option key={doc.id} value={doc.id}>
                {doc.name} • {doc.department}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Date"
          name="date"
          rules={[{ required: true, message: "Please select appointment date" }]}
        >
          <DatePicker format="YYYY-MM-DD" className="w-full" />
        </Form.Item>

        <Form.Item
          label="Time"
          name="time"
          rules={[{ required: true, message: "Please select appointment time" }]}
        >
          <TimePicker format="HH:mm" className="w-full" />
        </Form.Item>

        <Form.Item label="Notes" name="notes">
          <Input.TextArea rows={3} placeholder="Any additional notes" />
        </Form.Item>

        <Button type="primary" block loading={loading} onClick={handleSubmit}>
          Book Appointment
        </Button>
      </Form>
    </Modal>
  );
}

export default BookAppointment;
