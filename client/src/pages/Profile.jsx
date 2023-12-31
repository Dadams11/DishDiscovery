import { Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { QUERY_ME } from '../utils/queries';
import MapContainer from '../components/Map';

import Auth from '../utils/auth';
import RestaurantCard from '../components/RestaurantCard';

// Fix: add a closing curly brace for the Profile function
const Profile = () => {
  const { username: userParam } = useParams();

  const { loading, data } = useQuery(userParam ? QUERY_ME : QUERY_ME, {
    variables: { username: userParam },
  });

  const user = data?.me || data?.user || {};
  // navigate to personal profile page if username is yours
  if (Auth.loggedIn() && Auth.getProfile().data.username === userParam) {
    return <Navigate to="/me" />;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user?.email) {
    return (
      <h4>
        Viewing {`${user.email}'s`} profile.
        You need to be logged in to see this. Use the navigation links above to
        sign up or log in!
      </h4>
    );
  }

  const savedRestaurants = user.savedRestaurants.map((restaurant) => restaurant);

  // const savedRestaurantsNames = user.savedRestaurants.map((name) => user.savedRestaurants.name);

  // const newRestaurantLocations = savedRestaurants.map((location) => {lat: savedRestaurants.geometry.location.lat, lng: savedRestaurants.geometry.location.lng});

  const newMarkers = savedRestaurants.map(({ geometry, name }) => ({
    lat: parseFloat(geometry.location.lat),
    lng: parseFloat(geometry.location.lng),
    title: name,
  }));

  console.log("new Markers", newMarkers);




  return (
    <>
      <div className='d-flex flex-wrap'>
        <div className="flex-grid justify-center mb-3 my-auto mx-auto" >
            <RestaurantCard
              className="transparent-card"
              restaurants={user.savedRestaurants}
              title={`${user.email}'s favorites...`}
              showUsername={false}
            />
        </div>
      </div>
      <MapContainer markers={newMarkers}/>
    </>
  );
}

export default Profile;
