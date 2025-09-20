import leftBanner from "../../Assest/SVG/loginbanner.svg";
import chart from "../../Assest/SVG/loginchaticon.svg";
import doubt from "../../Assest/SVG/logindoubticon.svg";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { ForgetPassword,SetPassword } from "../../Service/api";
import { Spin } from 'antd';
import { CloseOutlined } from "@ant-design/icons";
import { LoadingOutlined } from '@ant-design/icons';
import {useState} from 'react'
import { Input } from "antd";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
const FormSchema = z.object({ EmailID: z.string().email() });
const FormSchema2 = z.object({
  password: z.string().min(1, { message: "Password required" }),
  confirmpassword: z.string().min(1, { message: "Password required" })
}).refine(data => data.password === data.confirmpassword, {
  message: "Passwords must match",
  path: ["confirmpassword"]
});


function Forgot() {
  const {register,handleSubmit,formState: { errors },setError,watch} = useForm({ resolver: zodResolver(FormSchema) });
  const { register: register1, handleSubmit: handleSubmit1, formState: { errors: errors1 },watch:watchdata } = useForm({ resolver: zodResolver(FormSchema2) });

  const [loader,setLoader] =useState(false)
  const [stage,setstage] = useState(false)
  const [EmailID,setEmailID] =useState("")
  const [OpenOtpBox, setopenOtpBox] = useState(false);

   const [otpvalue, setotp] = useState("");
   const onInput = (value) => {
     setotp(value);
   };
   
   const sharedProps = { onInput };
   const navigate = useNavigate();



  const onSubmit = async(data) => {
    try {
      setLoader(true)
      const result = await ForgetPassword(data)
      if(result.status == 200){
        setstage(true)
        setEmailID(data.EmailID)
        setLoader(false)
      }
      else{
        setError("EmailID", {
          type: "manual",
          message: "Email not found. Please enter a registered email.",
        });
        setLoader(false)
      }
      
    } catch (error) {
      setError("EmailID", {
        type: "manual",
        message: "Email not found. Please enter a registered email.",
      });
      setLoader(false)
    }
  };

  const onSubmit2 = async(data) => {
    try {
      setopenOtpBox(true)
    } catch (error) {
      console.log(error)
    }
  };

  const finalsubmit = async() => {
    try {
      setLoader(true)
      const result = await SetPassword({EmailID:watch('EmailID'),newpassword:watchdata('password'),OTP:otpvalue.join('')})
      if (result.status == 200) {
        setLoader(false);
        setopenOtpBox(false);
        navigate("/");
        toast.success("Successfully Changed!", {
          position: "top-center",
          autoClose: 3000,
        });
      } else {
        setLoader(false);
        setopenOtpBox(false);
        toast.error("please Try later", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.log(error)
      setLoader(false)
    }
  };

  return (
    <>
    {
      stage == false ? 
      (
        <div className="flex flex-col lg:flex-row lg:px-16 w-full lg:h-[100dvh]">
      {/* Left Container */}
      <div className="lg:w-[55%] h-full p-3 lg:p-5">
        <img src={leftBanner} className="w-full h-full" />
      </div>
      {/* Right Container */}
      <div className=" lg:w-[50%] flex flex-col lg:h-full p-5">
        <div className=" flex flex-col gap-3 mt-auto mb-auto">
          <div className="flex items-center justify-center">
           
          </div>
          <div className="text-center">
            <h1 className="text-[33px] lg:text-[40px] text-[#514242]">Forget Password</h1>
            <h1 className="font-light text-[15px] text-[#423C3C]">No worries, we’ll send you reset instructions</h1>
          </div>
          {/* Login Form */}
          <div className=" justify-center py-4 md:py-8 flex flex-col items-center gap-8">
            <form onSubmit={handleSubmit(onSubmit)}  className="flex w-full flex-col items-center gap-8">
                <div className="w-full max-w-[500px] flex flex-col gap-3">
                  <div className=" w-full max-w-[500px]">
                    <input {...register("EmailID")}  className=" bg-[#EFEFEF] text-[15px] w-full text-[#423C3C] h-[53px] md:h-[65px] rounded-md md:rounded-xl px-5 font-light " placeholder="EmailID"/>
                    {
                       errors.EmailID && (
                         <p className="font-light p-2 text-red-500 text-[14px]">
                           {errors.EmailID.message}*
                         </p>
                       )
                    }
                  </div>
                </div>
                <input  className="bg-[#000000] w-full max-w-[500px] h-[70px] rounded-xl text-white text-[20px] cursor-pointer" type="submit" value="Submit"/>
            </form>
            <div className=" w-full max-w-[500px] h-[40px] font-light flex flex-row gap-5 py-5 items-center">
            <Link to="/"  className="flex flex-row items-center mr-auto gap-2 cursor-pointer">
                <svg width="21" height="16" viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.292893 7.29289C-0.0976311 7.68342 -0.0976311 8.31658 0.292893 8.70711L6.65685 15.0711C7.04738 15.4616 7.68054 15.4616 8.07107 15.0711C8.46159 14.6805 8.46159 14.0474 8.07107 13.6569L2.41421 8L8.07107 2.34315C8.46159 1.95262 8.46159 1.31946 8.07107 0.928932C7.68054 0.538408 7.04738 0.538408 6.65685 0.928932L0.292893 7.29289ZM21 7L1 7V9L21 9V7Z" fill="black"/>
                </svg>
                Back to login
              </Link>
            </div>
            {/* <div className=" w-full max-w-[500px] h-[40px] font-light flex flex-row gap-5 text-[#5B5959] py-10 items-center justify-center">
              <div className="flex flex-row items-center  justify-end gap-2 h-full cursor-pointer">
                <img src={chart} alt="" className="w-[24px] opacity-80" />
                <p>Chat with us</p>
              </div>
              <div className="flex flex-row items-center justify-end gap-2 h-full cursor-pointer">
                <img src={doubt} alt="" className="w-[24px] opacity-80" />
                <p>Help</p>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
      ) : (
        <div className="flex flex-col lg:flex-row lg:px-16 w-full lg:h-[100dvh]">
      {/* Left Container */}
      <div className="lg:w-[55%] h-full p-3 lg:p-5">
        <img src={leftBanner} className="w-full h-full" />
      </div>
      {/* Right Container */}
      <div className=" lg:w-[50%] flex flex-col lg:h-full p-5">
        <div className=" flex flex-col gap-3 mt-auto mb-auto">
          <div className="flex items-center justify-center">
            <div className="text-left w-full max-w-[500px]">
               <h1 className="text-[33px] lg:text-[40px] text-[#514242]">Change Password</h1>
             </div>
          </div>
             
          {/* Login Form */}
          <div className=" justify-center py-4  flex flex-col items-center gap-8">
          <form onSubmit={handleSubmit1(onSubmit2)}  className="flex w-full flex-col items-center gap-8">
               <div className="w-full max-w-[500px] flex flex-col gap-5">
                  <div className=" w-full max-w-[500px]">
                    <h1 className="py-3 text-xl">New Password</h1>
                    <input {...register1("password")}  className=" bg-[#EFEFEF] text-[15px] w-full text-[#423C3C] h-[53px] md:h-[65px] rounded-md md:rounded-xl px-5 font-light " placeholder="Enter new password"/>
                    {
                       errors1.password && (
                         <p className="font-light p-2 text-red-500 text-[14px]">
                           {errors1.password.message}*
                         </p>
                       )
                    }
                  </div>
                  <div className=" w-full max-w-[500px]">
                    <h1 className="pb-3 text-xl">Confirm Password</h1>
                    <input {...register1("confirmpassword")} className=" bg-[#EFEFEF] text-[15px] w-full text-[#423C3C] h-[53px] md:h-[65px] rounded-md md:rounded-xl px-5 font-light " placeholder="Enter new password"/>
                    {
                       errors1.confirmpassword && (
                         <p className="font-light p-2 text-red-500 text-[14px]">
                           {errors1.confirmpassword.message}*
                         </p>
                       )
                    }
                  </div>
                  <input  className="bg-[#000000] w-full max-w-[500px] h-[70px] rounded-xl text-white text-[20px] cursor-pointer" type="submit" value="Submit"/>
                </div>
            </form>
            <div className=" w-full max-w-[500px] h-[40px] font-light flex flex-row gap-5 py-5 items-center">
            <Link to="/"  className="flex flex-row items-center mr-auto gap-2 cursor-pointer">
                <svg width="21" height="16" viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.292893 7.29289C-0.0976311 7.68342 -0.0976311 8.31658 0.292893 8.70711L6.65685 15.0711C7.04738 15.4616 7.68054 15.4616 8.07107 15.0711C8.46159 14.6805 8.46159 14.0474 8.07107 13.6569L2.41421 8L8.07107 2.34315C8.46159 1.95262 8.46159 1.31946 8.07107 0.928932C7.68054 0.538408 7.04738 0.538408 6.65685 0.928932L0.292893 7.29289ZM21 7L1 7V9L21 9V7Z" fill="black"/>
                </svg>
                Back to login
              </Link>
            </div>
            {/* <div className=" w-full max-w-[500px] h-[40px] font-light flex flex-row gap-5 text-[#5B5959] py-10 items-center justify-center">
              <div className="flex flex-row items-center  justify-end gap-2 h-full cursor-pointer">
                <img src={chart} alt="" className="w-[24px] opacity-80" />
                <p>Chat with us</p>
              </div>
              <div className="flex flex-row items-center justify-end gap-2 h-full cursor-pointer">
                <img src={doubt} alt="" className="w-[24px] opacity-80" />
                <p>Help</p>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
      )
    }
    {OpenOtpBox && (
        <div className="w-full h-full fixed top-0 bg-[#0000007c] flex items-center justify-center">
          <div className="bg-white w-[600px] rounded-2xl p-8 px-10 flex flex-col gap-4">
            <div className="w-full flex items-center justify-end">
              <CloseOutlined
                className="cursor-pointer"
                style={{ fontSize: "18px" }}
                onClick={() => {
                  setopenOtpBox(false);
                }}
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-semibold">
                Enter verification code
              </h1>
              <h1 className="text-lg text-[#767C8F]">
                6 digit OTP has been sent to EmailID {watch("EmailID")}
              </h1>
            </div>
            <div>
              <Input.OTP
                formatter={(str) => str.toUpperCase()}
                {...sharedProps}
                size="large"
                status=""
              />
            </div>
            <button
              className={`py-4 rounded-2xl text-lg  cursor-pointer ${
                otpvalue.length == 6
                  ? "bg-[#1194FF] text-white"
                  : "bg-[#D0D4DC]"
              }`}
              disabled={otpvalue.length !== 6}
              onClick={()=>finalsubmit()}
            >
              Submit
            </button>
          </div>
        </div>
      )
    }
    {
      loader && 
      <div className="w-full h-full fixed top-0 bg-[#0000007c] flex items-center justify-center">
             
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
              
      </div>
      
    }
    </>
  );
}

export default Forgot;
