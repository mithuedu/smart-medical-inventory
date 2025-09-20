import leftBanner from "../../Assest/SVG/loginbanner.svg";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { EyeOutlined, EyeInvisibleOutlined, LoadingOutlined } from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { getAuthentication } from "../../Service/api";
import { Spin } from "antd";
import { useDispatch } from "react-redux";
import { setUserInfo } from "../../Redux/Slice/UserInfo";

const FormSchema = z.object({
  EmailID: z.string().email(),
  Password: z.string().min(3),
});

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [passwordtoggle, setpassword] = useState(true);
  const { register, handleSubmit, formState: { errors }, setError } = useForm({ resolver: zodResolver(FormSchema) });
  const [loader, setLoader] = useState(false);
  const [loginType, setLoginType] = useState("patient"); // default patient login

  const updateUser = (userdata) => {
    dispatch(setUserInfo({
      username: userdata.username,
      name: userdata.name,
      emailid: userdata.email,
      phonenumber: userdata.phoneNumber,
      location: userdata.location,
      role:userdata.role
    }));
  };

const onSubmit = async (data) => {
  try {
    setLoader(true);
    const payload = { ...data, role: loginType };
    const result = await getAuthentication(payload);

    if (result.status === 200) {
      const user = result.data.user;

      if (loginType === "doctor" && user.role === "doctor") {
        updateUser(user);
        navigate("/DoctorHome");
      } else if (loginType === "patient" && user.role === "patient") {
        updateUser(user);
        navigate("/HomePage");
      } else {
        // ❌ Role mismatch alert
        alert(`You are not logged in as a ${loginType}. Please choose the correct role.`);
      }
    } else {
      setError("Password", {
        type: "manual",
        message: result.message,
      });
    }
  } catch (error) {
    console.log(error);
  } finally {
    setLoader(false);
  }
};


  return (
    <>
      <div className="flex flex-col lg:flex-row lg:px-16 w-full lg:h-[100dvh]">
        {/* Left Container */}
        <div className="lg:w-[55%] h-full p-3 lg:p-5">
          <img src={leftBanner} className="w-full h-full" />
        </div>

        {/* Right Container */}
        <div className=" lg:w-[50%] flex flex-col lg:h-full p-5">
          <div className=" flex flex-col gap-3 mt-auto mb-auto">
            <div className="text-center">
              <h1 className="text-[33px] lg:text-[40px] text-[#514242]">Welcome Back</h1>
              <h1 className="font-light text-[15px] text-[#423C3C]">Please login to your account</h1>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex justify-center py-4 md:py-8 flex-col items-center gap-4">

                {/* Switch Login Type */}
                <div className="flex w-full max-w-[500px] justify-center gap-4 mb-3">
                  <button
                    type="button"
                    onClick={() => setLoginType("patient")}
                    className={`px-6 py-2 rounded-xl border ${loginType === "patient" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
                  >
                    Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginType("doctor")}
                    className={`px-6 py-2 rounded-xl border ${loginType === "doctor" ? "bg-black text-white" : "bg-gray-200 text-black"}`}
                  >
                    Doctor
                  </button>
                </div>

                <div className="w-full max-w-[500px] flex flex-col gap-3">
                  {/* Email */}
                  <div className=" w-full max-w-[500px]">
                    <input {...register("EmailID")} className=" bg-[#EFEFEF] text-[15px] w-full text-[#423C3C] h-[53px] md:h-[65px] rounded-md md:rounded-xl px-5 font-light " placeholder="EmailID" />
                    {errors.EmailID && (
                      <p className="font-light p-2 text-red-500 text-[14px]">
                        {errors.EmailID.message}*
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className=" w-full max-w-[500px]">
                    <div className="relative">
                      <input
                        type={passwordtoggle ? "password" : "text"}
                        {...register("Password")}
                        className=" bg-[#EFEFEF] text-[15px] w-full text-[#423C3C] h-[53px] md:h-[65px] rounded-md md:rounded-xl px-5 font-light"
                        placeholder="Password"
                      />
                      {passwordtoggle ? (
                        <EyeInvisibleOutlined
                          className="absolute top-1/2 right-3 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                          style={{ fontSize: "120%" }}
                          onClick={() => setpassword(false)}
                        />
                      ) : (
                        <EyeOutlined
                          className="absolute top-1/2 right-3 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                          style={{ fontSize: "120%" }}
                          onClick={() => setpassword(true)}
                        />
                      )}
                    </div>
                    {errors.Password && (
                      <p className="font-light p-2 text-red-500 text-[14px]">
                        {errors.Password.message}*
                      </p>
                    )}
                  </div>
                </div>

                {/* Links */}
                <div className="flex w-full max-w-[500px]">
                  <Link to="/CreateNewAccount" className=" text-right px-4 py-2 text-[#423C3C] font-light cursor-pointer hover:to-blue-400">
                    Create new account
                  </Link>
                  <Link to="/Forgot" className=" flex-1 text-right px-4 py-2 text-[#423C3C] font-light cursor-pointer">
                    Forget password ?
                  </Link>
                </div>

                {/* Submit */}
                <input className="bg-[#000000] w-full max-w-[500px] h-[70px] rounded-xl text-white text-[20px]" type="submit" value="Login" />
              </div>
            </form>
          </div>
        </div>
      </div>

      {loader && (
        <div className="w-full h-full fixed top-0 bg-[#0000007c] flex items-center justify-center">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        </div>
      )}
    </>
  );
}

export default Login;
