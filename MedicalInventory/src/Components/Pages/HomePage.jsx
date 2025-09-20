import { useSelector } from "react-redux";
import Usersheader from "../UserCards/Usersheader";
import { useEffect, useState } from "react";
import { Spin, Button, Modal, Tabs } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import UserPanel from "../UserCards/UserPanel.jsx";

import BookAppointment from "../Cards/BookAppointment";
import AppointmentDetails from "../Cards/AppointmentDetails";
import UpcomingAppointments from "../Cards/UpcomingAppointments";

// Recharts imports
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function HomePage() {
  const userInfo = useSelector((state) => state.userinfo);
  const [loader, setLoader] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [checkups, setCheckups] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [openUpcoming, setOpenUpcoming] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [Userfullpanel, setuserfullpanel] = useState(false);
  const [graphModal, setGraphModal] = useState(false); // Graph modal
  const [checkupsModal, setCheckupsModal] = useState(false); // Checkups modal

  const userfullpaneltoggle = () => setuserfullpanel(!Userfullpanel);
  const BookAppointmentdata = () => setOpenModal(!openModal);
  const GraphModaltoggle = () => setGraphModal(!graphModal);
  const CheckupsModatoggle = () => setCheckupsModal(!checkupsModal);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoader(true);
      try {
        const res = await fetch(
          `https://my-backend-ex0j.onrender.com/api/appointments/user/${userInfo.emailid}`
        );
        const data = await res.json();
        if (data.success) {
          const mappedAppointments = data.data.map((app) => ({
            id: app.id,
            doctor: app.doctor,
            date: new Date(app.appointment_date).toLocaleDateString(),
            time: app.appointment_time,
            dept: app.department,
            location: "Not available",
            status: app.status.charAt(0).toUpperCase() + app.status.slice(1),
            avatar: app.doctor
              .split(" ")
              .map((n) => n[0])
              .join(""),
            notes: app.notes,
            building_name: app.building_name,
            room_number: app.room_number,
            prescription: app.prescription || "",
          }));
          setAppointments(mappedAppointments);

          // Prepare chart data
          const graphData = {};
          mappedAppointments.forEach((a) => {
            if (!graphData[a.date]) graphData[a.date] = 0;
            graphData[a.date] += 1;
          });
          const chartArray = Object.keys(graphData).map((date) => ({
            date,
            Appointments: graphData[date],
          }));
          setCheckups(chartArray);
        } else {
          setAppointments([]);
          setCheckups([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoader(false);
      }
    };

    if (userInfo?.emailid) fetchAppointments();
  }, [userInfo?.emailid, openModal, openUpcoming]);

  // Filtered appointments
  const upcomingAppointments = appointments.filter(
    (app) => app.status !== "Completed"
  );
  const completedAppointments = appointments.filter(
    (app) => app.status === "Completed"
  );

  const statusClasses = (status) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      case "Completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleBookAppointment = (newAppointment) => {
    setAppointments((prev) => [
      ...prev,
      { ...newAppointment, id: Date.now(), status: "Pending", avatar: "PT" },
    ]);
  };

  const handleDetails = (app) => {
    setSelectedAppointment(app);
    setOpenDetails(true);
  };

  return (
    <>
      <Usersheader userInfo={userInfo} userfullpaneltoggle={userfullpaneltoggle}  />

      <div className="relative min-h-screen max-w-screen-xl mx-auto py-10 px-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[
            {
              title: "Book Appointment",
              icon: "🩺",
              gradient: "from-indigo-500 to-purple-500",
              action: () => setOpenModal(true),
            },
            { title: "Find Pharmacy", icon: "💊", gradient: "from-rose-500 to-pink-400" },
            { title: "View Checkups", icon: "📋", gradient: "from-emerald-400 to-teal-500", action: () => setCheckupsModal(true) },
            {
              title: "View Appointments Graph",
              icon: "📊",
              gradient: "from-yellow-400 to-orange-500",
              action: () => setGraphModal(true),
            },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={item.action}
              className={`rounded-2xl p-4 shadow-lg h-[110px] transform hover:-translate-y-1 transition-all cursor-pointer bg-gradient-to-br ${item.gradient} text-white flex items-center justify-between`}
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">{item.icon}</div>
                <div>
                  <h3 className="font-semibold text-sm">{item.title}</h3>
                  <p className="text-xs opacity-90">Quick access</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Appointments */}
          <div className="lg:col-span-2">
            <section className="p-6 bg-white rounded-2xl shadow">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-800">Upcoming Appointments</h1>
                <p className="text-sm text-gray-500">{upcomingAppointments.length} scheduled</p>
              </div>

              <div className="space-y-4">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between border border-gray-300 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 font-semibold">
                          {app.avatar || app.doctor.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">Dr. {app.doctor}</h3>
                          <p className="text-sm text-gray-500">
                            {app.dept} • {app.building_name} • {app.room_number}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">{app.notes}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-blue-600">{app.date}</div>
                          <div className="text-xs text-gray-500">{app.time}</div>
                        </div>

                        <div className={`px-3 py-1 text-xs rounded-full font-medium ${statusClasses(app.status)}`}>
                          {app.status}
                        </div>

                        <div className="flex gap-2 mt-2">
                          <Button size="small" type="primary" onClick={() => handleDetails(app)}>
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No upcoming appointments</p>
                )}
              </div>
            </section>

            {/* Completed Appointments */}
            <section className="p-6 bg-white rounded-2xl shadow mt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-gray-800">Completed Appointments</h2>
                <p className="text-sm text-gray-500">{completedAppointments.length}</p>
              </div>

              <div className="space-y-3">
                {completedAppointments.length > 0 ? (
                  completedAppointments.map((app) => (
                    <div
                      key={app.id}
                      className="border rounded-lg p-3 hover:shadow-md transition cursor-pointer"
                      onClick={() => handleDetails(app)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold">Dr. {app.doctor}</div>
                          <div className="text-sm text-gray-500">
                            {app.dept} • {app.date}
                          </div>
                          <p className="mt-2 text-sm text-gray-600">{app.notes}</p>
                        </div>
                        <div className={`ml-4 px-2 py-1 rounded-md text-xs font-medium ${statusClasses(app.status)}`}>
                          {app.status}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No completed appointments</p>
                )}
              </div>
            </section>
          </div>

          {/* Right column: Health summary */}
          <aside>
            <section className="p-6 bg-gradient-to-br from-indigo-50 to-white rounded-2xl shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Health Summary</h3>
              <div className="text-sm text-gray-600">
                <div className="flex justify-between py-1">
                  <span>Next Appointment</span>
                  <span className="font-medium">{upcomingAppointments[0]?.date ?? "—"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Active Prescriptions</span>
                  <span className="font-medium">{prescriptions.length}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Recent Checkups</span>
                  <span className="font-medium">{checkups.length}</span>
                </div>
              </div>
              <div className="mt-4">
                <Button type="primary" block onClick={() => setGraphModal(true)}>
                  View Graph
                </Button>
              </div>
            </section>
          </aside>
        </div>

        {/* Loader */}
        {loader && (
          <div className="w-full h-full fixed inset-0 bg-[#0000007c] flex items-center justify-center z-50">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
          </div>
        )}
      </div>

      {/* Book & Details Modals */}
      <BookAppointment open={openModal} onClose={() => setOpenModal(false)} onSuccess={handleBookAppointment} />
      <AppointmentDetails open={openDetails} onClose={() => setOpenDetails(false)} appointment={selectedAppointment} />

      {Userfullpanel && (
        <UserPanel
          BookAppointmentdata={BookAppointmentdata}
          userfullpaneltoggle={userfullpaneltoggle}
          CheckupsModatoggle={CheckupsModatoggle} GraphModaltoggle={GraphModaltoggle}
          onOpenUpcoming={() => {
            setOpenModal(false);
            setOpenUpcoming(true);
          }}
        />
      )}

      <UpcomingAppointments
        open={openUpcoming}
        onClose={() => setOpenUpcoming(false)}
        appointments={upcomingAppointments}
        onDetails={(app) => {
          setSelectedAppointment(app);
          setOpenDetails(true);
          setOpenUpcoming(false);
        }}
      />

      {/* Graph Modal */}
      <Modal
        title="Appointments Over Time"
        open={graphModal}
        onCancel={() => setGraphModal(false)}
        footer={null}
        width={800}
      >
        {checkups.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={checkups} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Appointments" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center">No data available for the graph</p>
        )}
      </Modal>

      {/* Checkups Modal */}
      <Modal
        title="Your Checkups"
        open={checkupsModal}
        onCancel={() => setCheckupsModal(false)}
        footer={null}
        width={700}
      >
        <Tabs defaultActiveKey="1">
          <Tabs.TabPane tab={`Pending (${upcomingAppointments.length})`} key="1">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((app) => (
                <div
                  key={app.id}
                  className="border rounded-lg p-3 hover:shadow-md transition cursor-pointer mb-2"
                  onClick={() => handleDetails(app)}
                >
                  <div className="flex justify-between items-center">
                    <span>
                      Dr. {app.doctor} - {app.dept} - {app.date}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No pending checkups</p>
            )}
          </Tabs.TabPane>

          <Tabs.TabPane tab={`Completed (${completedAppointments.length})`} key="2">
            {completedAppointments.length > 0 ? (
              completedAppointments.map((app) => (
                <div
                  key={app.id}
                  className="border rounded-lg p-3 hover:shadow-md transition cursor-pointer mb-2"
                  onClick={() => handleDetails(app)}
                >
                  <div className="flex justify-between items-center">
                    <span>
                      Dr. {app.doctor} - {app.dept} - {app.date}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No completed checkups</p>
            )}
          </Tabs.TabPane>
        </Tabs>
      </Modal>
    </>
  );
}

export default HomePage;


