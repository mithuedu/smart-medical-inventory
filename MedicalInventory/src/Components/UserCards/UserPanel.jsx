import { useSelector } from "react-redux";
import { LogoutOutlined, RightOutlined, CalendarOutlined, FileTextOutlined, HistoryOutlined, BarChartOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

function UserPanel(props) {
  const navigate=useNavigate('')
  const userInfo = useSelector((state) => state.userinfo);

  return (
    <div className="w-full h-full fixed top-0 bg-[#0000007c] flex items-center justify-end z-50">
      <div className="w-[400px] h-full bg-white px-5">
        {/* Close button */}
        <div className="py-5 flex justify-end ">
          <svg
            onClick={props.userfullpaneltoggle}
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 cursor-pointer text-gray-600 hover:text-gray-800 transition"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        {/* User Info */}
        <h1 className="text-2xl uppercase font-semibold">{userInfo.name}</h1>
        <hr className="w-[180px] h-3 border-gray-400" />
        <h1 className="text-gray-800 font-light text-md">Username : <span>{userInfo.username}</span></h1>
        <h1 className="text-gray-800 font-light text-md">Email ID : <span>{userInfo.emailid}</span></h1>
        <h1 className="text-gray-800 font-light text-md">Phone Number : <span>{userInfo.phonenumber}</span></h1>

        {/* Menu Items */}
        <div
          className="flex items-center gap-3 py-3 hover:scale-102 cursor-pointer"
          onClick={ ()=>props.BookAppointmentdata() }
        >
          <CalendarOutlined style={{ fontSize: 22 }} />
          <h1 className="text-xl flex-1">Book Appointment</h1>
          <RightOutlined />
        </div>

        <div
          className="flex items-center gap-3 py-3 hover:scale-102 cursor-pointer"
          onClick={() => props.onOpenUpcoming && props.onOpenUpcoming()} // <--- changed
        >
          <FileTextOutlined style={{ fontSize: 22 }} />
          <h1 className="text-xl flex-1">Upcoming Appointments</h1>
          <RightOutlined />
        </div>

        <div
          className="flex items-center gap-3 py-3 hover:scale-102 cursor-pointer"
          onClick={() => props.CheckupsModatoggle()}
        >
          <HistoryOutlined style={{ fontSize: 22 }} />
          <h1 className="text-xl flex-1">Recent Checkups</h1>
          <RightOutlined />
        </div>

        <div
          className="flex items-center gap-3 py-3 hover:scale-102 cursor-pointer"
          onClick={() => props.GraphModaltoggle()}
        >
          <BarChartOutlined style={{ fontSize: 22 }} />
          <h1 className="text-xl flex-1">Health Summary</h1>
          <RightOutlined />
        </div>

        {/* Logout */}
        <div
          className="flex items-center gap-3 py-3 hover:scale-102 cursor-pointer"
          onClick={() => {navigate('/')}}
        >
          <LogoutOutlined style={{ fontSize: 22 }} />
          <h1 className="text-xl flex-1">Logout</h1>
          <RightOutlined />
        </div>
      </div>
    </div>
  );
}

export default UserPanel;
