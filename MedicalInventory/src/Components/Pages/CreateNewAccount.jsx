import leftBanner from "../../Assest/SVG/loginbanner.svg";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Checkbox, Input, Spin } from "antd";
import { CloseOutlined, LoadingOutlined } from "@ant-design/icons";
import { Otp_verification, registernewstore } from "../../Service/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Warning from "../../Assest/SVG/warning.svg";

const FormSchema = z.object({
  username: z.string().min(3).max(100),
  name: z.string().min(3).max(100),
  PhoneNumber: z.string().min(1).regex(/^\d{10}$/, "Invalid PhoneNumber"),
  EmailID: z.string().email({ message: "Invalid email address." }),
  address: z.string().min(1, { message: "Address Required" }),
  password: z.string().min(1, { message: "password required" }),
});

function CreateNewAccount() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({ resolver: zodResolver(FormSchema) });

  const [Errorpop, setErrorpop] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loader, setLoader] = useState(false);
  const [OpenOtpBox, setopenOtpBox] = useState(false);
  const [otpvalue, setotp] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      setLoader(true);
      const result = await registernewstore(data);

      console.log(result)

      // Handle conflict returned without throwing (e.g., fetch-like clients)
     if (result?.status == 409) {
toast.info(`User already exists.`, { position: "top-center", autoClose: 2000 });
}



      // If backend returns success
      if (result?.status === 200 || result?.status === 201) {
        setLoader(false);
        setopenOtpBox(true);
        toast.info(`OTP sent to ${data.EmailID}`, { position: "top-center", autoClose: 2000 });
        return;
      }

      
      // Other non-2xx responses
      setLoader(false);
      const msg = (result?.data && (result.data.message || result.data)) || "Registration failed";
      toast.error(msg, { position: "top-center", autoClose: 3000 });
    } catch (error) {
      setLoader(false);
      console.error("register error", error)
  
    }
  };

  const verifyOtp = async (mailid, otpString) => {
    try {
      setLoader(true);
      const result = await Otp_verification(mailid, otpString);
      if (result?.status === 200 || result?.status === 201) {
        setLoader(false);
        setopenOtpBox(false);
        toast.success("Successfully Registered!", { position: "top-center", autoClose: 2500 });
        setTimeout(() => navigate("/"), 1000);
      } else {
        setLoader(false);
        const msg = (result?.data && (result.data.message || result.data)) || "OTP verification failed";
        toast.error(msg, { position: "top-center", autoClose: 3000 });
      }
    } catch (error) {
      setLoader(false);
      console.error("verifyOtp error", error);
      const serverMsg = error?.response?.data?.message || error?.response?.data;
      toast.error(serverMsg || "Verification error. Try again.", { position: "top-center", autoClose: 3000 });
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:px-16 w-full lg:h-[100dvh]">
        {/* Left Container */}
        <div className="lg:w-[55%] h-full p-3 lg:p-5">
          <img src={leftBanner} className="w-full h-full" alt="login banner" />
        </div>

        {/* Right Container */}
        <div className=" lg:w-[50%] flex flex-col lg:h-full p-5">
          <div className=" flex flex-col gap-3 mt-auto mb-auto">
            <div className="text-center">
              <h1 className="text-[33px] lg:text-[40px] text-[#514242]">Create Your Account</h1>
              <h1 className="font-light text-[15px] text-[#423C3C]">Join Us Today! Create Your Account</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex justify-center py-4 md:py-8 flex-col items-center gap-4">
                <div className="w-full max-w-[700px] flex flex-col gap-5">
                  <div className=" w-full max-w-[1000px] flex gap-3">
                    <div className="w-full">
                      <input {...register("username")}
                        className=" bg-[#f0f0f0] text-[18px] w-full text-[#423C3C] h-[53px] md:h-[65px] rounded-md md:rounded-xl px-5 font-light "
                        placeholder="Username"
                      />
                      {errors.username && <p className="font-light p-1 text-red-500 text-[14px]">{errors.username.message}*</p>}
                    </div>
                    <div className="w-full">
                      <input {...register("name")}
                        className=" bg-[#f0f0f0] text-[18px] w-full text-[#423C3C] h-[53px] md:h-[65px] rounded-md md:rounded-xl px-5 font-light "
                        placeholder="Name"
                      />
                      {errors.name && <p className="font-light p-1 text-red-500 text-[14px]">{errors.name.message}*</p>}
                    </div>
                  </div>

                  <div className=" w-full max-w-[1000px] flex gap-3">
                    <div className="w-full">
                      <input {...register("PhoneNumber")}
                        className=" bg-[#f0f0f0] text-[18px] w-full text-[#423C3C] h-[53px] md:h-[65px] rounded-md md:rounded-xl px-5 font-light "
                        placeholder="PhoneNumber"
                      />
                      {errors.PhoneNumber && <p className="font-light p-1 text-red-500 text-[14px]">{errors.PhoneNumber.message}*</p>}
                    </div>
                    <div className="w-full">
                      <input {...register("EmailID")}
                        className=" bg-[#f0f0f0] text-[18px] w-full text-[#423C3C] h-[53px] md:h-[65px] rounded-md md:rounded-xl px-5 font-light "
                        placeholder="Email ID"
                      />
                      {errors.EmailID && <p className="font-light p-1 text-red-500 text-[14px]">{errors.EmailID.message}*</p>}
                    </div>
                  </div>

                  <div className=" w-full max-w-[1000px] flex gap-3">
                    <div className="w-full">
                      <input {...register("address")}
                        className=" bg-[#f0f0f0] text-[18px] w-full text-[#423C3C] h-[53px] md:h-[65px] rounded-md md:rounded-xl px-5 font-light "
                        placeholder="Address"
                      />
                      {errors.address && <p className="font-light p-1 text-red-500 text-[14px]">{errors.address.message}*</p>}
                    </div>
                    <div className="w-full">
                      <input {...register("password")}
                        type="password"
                        className=" bg-[#f0f0f0] text-[18px] w-full text-[#423C3C] h-[53px] md:h-[65px] rounded-md md:rounded-xl px-5 font-light "
                        placeholder="Password"
                      />
                      {errors.password && <p className="font-light p-1 text-red-500 text-[14px]">{errors.password.message}*</p>}
                    </div>
                  </div>

                  <Checkbox>Get Update via Message or Call</Checkbox>
                </div>

                <div className="w-full  max-w-[700px] flex items-center py-4">
                  <div className="flex-1">
                    <Link to="/" className="flex flex-row items-center mr-auto gap-2 cursor-pointer">
                      {/* back svg */}
                      <svg width="21" height="16" viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0.292893 7.29289C-0.0976311 7.68342 -0.0976311 8.31658 0.292893 8.70711L6.65685 15.0711C7.04738 15.4616 7.68054 15.4616 8.07107 15.0711C8.46159 14.6805 8.46159 14.0474 8.07107 13.6569L2.41421 8L8.07107 2.34315C8.46159 1.95262 8.46159 1.31946 8.07107 0.928932C7.68054 0.538408 7.04738 0.538408 6.65685 0.928932L0.292893 7.29289ZM21 7L1 7V9L21 9V7Z" fill="black"/>
                      </svg>
                      Back to login
                    </Link>
                  </div>

                  <input
                    className="bg-[#000000] w-full  max-w-[300px] h-[53px] rounded-xl text-white text-[20px] cursor-pointer"
                    type="submit"
                    value="Submit"
                  />
                </div>
              </div>
            </form>
          </div>
        </div>

        <ToastContainer />
      </div>

      {/* OTP modal */}
      {OpenOtpBox && (
        <div className="w-full h-full fixed top-0 bg-[#0000007c] flex items-center justify-center z-50">
          <div className="bg-white w-[600px] rounded-2xl p-8 px-10 flex flex-col gap-4">
            <div className="w-full flex items-center justify-end">
              <CloseOutlined className="cursor-pointer" style={{ fontSize: "18px" }} onClick={() => setopenOtpBox(false)} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-semibold">Enter verification code</h1>
              <h1 className="text-lg text-[#767C8F]">6 digit OTP has been sent to EmailID {watch("EmailID")}</h1>
            </div>

            {/* Antd Input.OTP accepts value & onChange pattern — use controlled input */}
            <div>
              <Input.OTP
                value={otpvalue}
                onChange={(val) => {
                  if (typeof val === "string") setotp(val);
                  else if (val?.target?.value) setotp(val.target.value);
                }}
                size="large"
              />
            </div>

            <button
              className={`py-4 rounded-2xl text-lg  cursor-pointer ${otpvalue.length === 6 ? "bg-[#1194FF] text-white" : "bg-[#D0D4DC]"}`}
              disabled={otpvalue.length !== 6}
              onClick={() => verifyOtp(watch("EmailID"), otpvalue)}
            >
              Verify
            </button>
          </div>
        </div>
      )}

      {/* error popup */}
      {Errorpop && (
        <div className="w-full h-full fixed top-0 bg-[#0000007c] flex items-center justify-center z-50">
          <div className="bg-white w-[550px] rounded-2xl p-6 px-10 flex flex-col items-center text-center gap-4">
            <img src={Warning} className="w-16" alt="warning" />
            <h1 className="text-[18px]">{errorMsg || "User already exists. Please use a different Email and Phone number or log in."}</h1>
            <div className="flex gap-4">
              <button
                className="bg-[#19C12D] px-10 py-2 rounded-xl text-white cursor-pointer"
                onClick={() => setErrorpop(false)}
              >
                Ok
              </button>
              <button
                className="bg-[#1194FF] px-6 py-2 rounded-xl text-white cursor-pointer"
                onClick={() => {
                  // navigate to login to allow quick login
                  setErrorpop(false);
                  navigate("/");
                }}
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}

      {loader && (
        <div className="w-full h-full fixed top-0 bg-[#0000007c] flex items-center justify-center z-50">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        </div>
      )}
    </>
  );
}

export default CreateNewAccount;
