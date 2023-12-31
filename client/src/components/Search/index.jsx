import { useLazyQuery, useQuery, useMutation } from '@apollo/client';
import { QUERY_RESTAURANTS, QUERY_ME } from '../../utils/queries';
import { SAVE_RESTAURANT } from '../../utils/mutations';
import { useEffect, useState } from 'react';
import { Card, Button } from 'react-bootstrap';
import Auth from '../../utils/auth';
import LocationForm from '../LocationForm';


function cleanTypename(obj) {
  const { __typename, ...result } = obj;
  Object.keys(result).forEach(key => {
    if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = cleanTypename(result[key]);
    }
  });
  return result;
}

const SearchBar = () => {
  const [term, setTerm] = useState('');
  const [getRestaurants, { loading, error, data }] = useLazyQuery(QUERY_RESTAURANTS);
  const [saveRestaurant] = useMutation(SAVE_RESTAURANT);
  const [address, setAddress] = useState('');

  const { data: dataMe } = useQuery(QUERY_ME, {
    variables: { username: "me" },
  });

  console.log(dataMe);

  const [location, setLocation] = useState({
    lat: 39.983334,
    lng: -82.983330
  });


  const onAddressChange = (address) => {
    setAddress(address);
    console.log(address);
  };

  const onLocationChange = (lat, lng) => {
    setLocation({ lat, lng });
    console.log(lat, lng);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    getRestaurants({ variables: { term: term, location: location } });
    console.log(data.searchRestaurants);
  };

  const handleSaveRestaurant = async (restaurant) => {
    // get token

    console.log(restaurant);
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false;
    }

    try {
      // remove __typename field from restaurant object
      const restaurantInput = cleanTypename(restaurant);

      // call the saveRestaurant mutation with restaurantInput
      const { data } = await saveRestaurant({
        variables: { input: restaurantInput },
      });

    } catch (err) {
      console.error(err);
    }
  }

  // Log the restaurant data when it changes
  useEffect(() => {
    if (dataMe?.me?.savedRestaurants) {
      console.log(dataMe.me.savedRestaurants);
    }
  }, [dataMe]);
  
  return (
    <div className='mt-5 pt-5'>
      <h1>Search Restaurants</h1>
      <form className="form-inline" onSubmit={handleSubmit}>
        <div className='form-group mx-sm-3 mb-2'>
        <input
          type="text"
          className="form-control"
          value={term}
          onChange={e => setTerm(e.target.value)}
          placeholder="Search restaurants..."
        />
        <LocationForm 
        address={address} 
        onAddressChange= { (address) => onAddressChange(address)}
        onLocationChange= { (loc) => onLocationChange( loc.lat, loc.lng)}
        />
        </div>
        <button type="submit" className='btn btn-outline-light mb-2'>Search</button>
      </form>
      <div className="card-container">
        {loading && <div>Loading...</div>}
        {error && <div>Error! {error.message}</div>}
        {data && !data.searchRestaurants.length && <div>No results found!</div>}

        {/* if restraunt data exists */}
        {data && data.searchRestaurants.length && <div>Results: {data.searchRestaurants.length}</div>}

        {data && data.searchRestaurants.map((restaurant) => (
          <Card className='transparent-card px-4' key={restaurant.place_id} style={{ width: '18rem', display: 'inline-block' }}>
            <Card.Body>
              <Card.Title>{restaurant.name}</Card.Title>
              <Card.Subtitle className="mb-2 text-muted">{restaurant.vicinity}</Card.Subtitle>
              <Card.Text>
                Rating: {restaurant.rating} ({restaurant.user_ratings_total} reviews)
              </Card.Text>
              <div>
                <Button variant="primary" size="sm" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${restaurant.name}&query_place_id=${restaurant.place_id}`)}>Map</Button>
                {dataMe?.me?.savedRestaurants && (
                  <Button variant="success" size="sm" onClick={() =>
                     handleSaveRestaurant(restaurant)} 
                     disabled={dataMe.me.savedRestaurants.some(savedRestaurant => savedRestaurant.place_id === restaurant.place_id)}>Favorite</Button>
                )}
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default SearchBar;