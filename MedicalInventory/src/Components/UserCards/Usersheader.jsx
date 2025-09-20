import location from "../../Assest/SVG/location.svg"
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { setUserInfo } from '../../Redux/Slice/UserInfo.js'

function Usersheader(props) {
  const [city, setCity] = useState("Fetching location...");
  const dispatch = useDispatch();
  const [manualSelect, setManualSelect] = useState(false);


  // ✅ Sri Lanka major districts/cities
  const sriLankaCities = [
    "Colombo",
    "Gampaha",
    "Kalutara",
    "Kandy",
    "Matale",
    "Nuwara Eliya",
    "Galle",
    "Matara",
    "Hambantota",
    "Jaffna",
    "Kilinochchi",
    "Mannar",
    "Vavuniya",
    "Mullaitivu",
    "Batticaloa",
    "Ampara",
    "Trincomalee",
    "Kurunegala",
    "Puttalam",
    "Anuradhapura",
    "Polonnaruwa",
    "Badulla",
    "Monaragala",
    "Ratnapura",
    "Kegalle"
  ];

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          fetchCityName(latitude, longitude);
        },
        () => {
          setManualSelect(true);
        }
      );
    } else {
      setManualSelect(true);
    }
  }, []);

  const fetchCityName = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&countrycodes=lk`
      );
      const data = await response.json();

      if (data.address?.city || data.address?.town || data.address?.village) {
        const location =
          data.address.city || data.address.town || data.address.village;

        setCity(location);
        dispatch(setUserInfo({ userCurrentLocation: location }));
      } else {
        setManualSelect(true);
      }
    } catch (error) {
      setManualSelect(true);
    }
  };

  return (
    <div className='h-[80px] border border-gray-300 relative flex gap-3 px-5'>
      <div className='flex items-center ml-auto mr-auto'>
        <div className="h-full flex items-center">
          <h1 className="font-semibold">Hosipital KM</h1>
        </div>
        <div className='flex gap-2 px-4 items-center'>
          <img src={location} alt='' className='w-[30px]' />
          <div className="flex flex-col h-1/2">
            <h1 className="text-gray-400 text-sm">Select Location</h1>
            {!manualSelect ? (
              <h1
                className="font-semibold -mt-0.5 flex items-center cursor-pointer "
                onClick={() => { setManualSelect(true) }}
              >
                {city}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 ml-2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </h1>
            ) : (
              <select
                className="font-semibold -mt-0.5 flex items-center cursor-pointer "
                onChange={(e) => {
                  setCity(e.target.value);
                  dispatch(setUserInfo({ userCurrentLocation: e.target.value }));
                }}
              >
                <option value="">Select City</option>
                {sriLankaCities.map((city, index) => (
                  <option key={index} value={city}>{city}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className='flex items-center px-5'>
          <div className="relative flex items-center lg:w-[250px] xl:w-[400px]">
            {/* search bar can go here */}
          </div>
        </div>
        <div className='flex items-center w-[300px] justify-end gap-5'>
          <div
            onClick={() => { props.userfullpaneltoggle() }}
            className='bg-[#ff4343] w-12 h-12 rounded-full flex items-center cursor-pointer justify-center text-2xl font-semibold text-white'
          >
            {props.userInfo.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Usersheader
