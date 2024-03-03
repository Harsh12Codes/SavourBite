import { useEffect, useState } from "react";
import "./restaurants.css";
import SquareCard from "../../components/cards/SquareCard";
import Shimmer from "../../components/shimmer/Shimmer";
import { Link } from "react-router-dom";
import { useLocation } from "../../hooks/useLocation";
import useOnlineStatus from "../../hooks/useOnlineStatus";
import OfflineScreen from "../../components/offlineScreen/OfflineScreen";
import useDebounce from "../../hooks/useDebounce";
import { isMobile } from "react-device-detect";

export default function Restaurants() {
    const onlineStatus = useOnlineStatus();
    const [listOfRestaurants, setListOfRestaurants] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [searchRestaurant, setSearchRestaurant] = useState("");
    const [swiggyActive, setSwiggyActive] = useState(true);
    const { currentLocation } = useLocation();
    const [initalRender, setInitialRender] = useState(true);
    const debounceValue = useDebounce(searchRestaurant, 1000);

    const fetchData = async (coordinates) => {
        try {
            const url = isMobile
                ? `https://www.swiggy.com/mapi/homepage/getCards?lat=${coordinates.latitude}&lng=${coordinates.longitude}`
                : `https://www.swiggy.com/dapi/restaurants/list/v5?lat=${coordinates.latitude}&lng=${coordinates.longitude}&is-seo-homepage-enabled=true&page_type=DESKTOP_WEB_LISTING`;

            const main_url = "https://corsproxy.org/?" + encodeURIComponent(url);
            const response = await fetch(
                "https://corsproxy.org/?" +
                    encodeURIComponent(
                        "https://www.swiggy.com/dapi/restaurants/list/v5?lat=28.6773353&lng=77.3464618&is-seo-homepage-enabled=true&page_type=DESKTOP_WEB_LISTING",
                    ),
            );
            const responseJson = await response.json();
            const cards = isMobile ? responseJson.data.success.cards : responseJson.data.cards;

            const locUnavailable = isMobile
                ? cards.find(
                      (card) =>
                          card.gridWidget &&
                          card.gridWidget.gridElements &&
                          card.gridWidget.gridElements.infoWithStyle["@type"] ===
                              "type.googleapis.com/swiggy.seo.widgets.v1.SwiggyNotPresent",
                  )
                : cards.find(
                      (card) =>
                          card.card &&
                          card.card.card &&
                          card.card.card["@type"] ===
                              "type.googleapis.com/swiggy.seo.widgets.v1.SwiggyNotPresent",
                  );

            if (locUnavailable !== undefined) {
                setSwiggyActive(false);
                return;
            }

            const desiredCard = isMobile
                ? cards.find(
                      (card) =>
                          card.gridWidget &&
                          card.gridWidget.gridElements &&
                          card.gridWidget.gridElements.infoWithStyle["@type"] ===
                              "type.googleapis.com/swiggy.presentation.food.v2.RestaurantInfoWithStyle",
                  )
                : cards.find(
                      (card) =>
                          card.card &&
                          card.card.card &&
                          card.card.card.gridElements &&
                          card.card.card.gridElements.infoWithStyle &&
                          card.card.card.gridElements.infoWithStyle["@type"] ===
                              "type.googleapis.com/swiggy.presentation.food.v2.FavouriteRestaurantInfoWithStyle",
                  );
            const restaurants = isMobile
                ? desiredCard?.gridWidget?.gridElements?.infoWithStyle?.restaurants
                : desiredCard?.card?.card?.gridElements?.infoWithStyle?.restaurants;
            const filteredDetails = restaurants.map((shop) => {
                const {
                    id,
                    name,
                    cuisines,
                    avgRatingString,
                    sla,
                    cloudinaryImageId,
                    veg,
                    costForTwo,
                } = shop.info;
                const { deliveryTime } = sla;
                return {
                    id,
                    name,
                    cuisines,
                    avgRatingString,
                    deliveryTime,
                    cloudinaryImageId,
                    veg,
                    costForTwo,
                };
            });

            setListOfRestaurants(filteredDetails);
            setFilteredList(filteredDetails);
        } catch (error) {
            console.error("Error fetching restaurants:", error);
        }
    };

    useEffect(() => {
        fetchData(currentLocation);
    }, [currentLocation]);

    useEffect(() => {
        if (!initalRender) {
            handleSearch();
        } else {
            setInitialRender(false);
        }
    }, [debounceValue]);

    const handleSearch = () => {
        const filteredRestaurants = listOfRestaurants.filter((res) =>
            res.name.toLowerCase().includes(searchRestaurant.toLowerCase()),
        );
        setFilteredList(filteredRestaurants);
    };

    const handleFastDelivery = () => {
        const fastDeliveryOutput = listOfRestaurants.filter((res) => res.deliveryTime < 30);
        setFilteredList(fastDeliveryOutput);
    };

    const handleVeg = () => {
        const vegOutput = listOfRestaurants.filter((res) => res.veg === true);
        setFilteredList(vegOutput);
    };

    const handleRating = () => {
        const ratingOutput = listOfRestaurants.filter((res) => Number(res.avgRatingString) > 4.2);
        setFilteredList(ratingOutput);
    };

    const handleRange = (rangeKey) => {
        const rangeOutput = listOfRestaurants.filter((res) => {
            const cost = res.costForTwo.match(/\d+/g).map(Number)[0];
            if (rangeKey === 1) return cost >= 300 && cost <= 600;
            else if (rangeKey === 2) return cost < 300;
        });
        setFilteredList(rangeOutput);
    };

    const handleAllRestaurant = () => {
        setFilteredList(listOfRestaurants);
    };

    if (!swiggyActive) {
        return <OfflineScreen type={"unavailable"} />;
    }
    if (!onlineStatus) {
        return <OfflineScreen type={"offline"} />;
    }
    return listOfRestaurants.length === 0 ? (
        <Shimmer />
    ) : (
        <div className="restaurants">
            <div className="filters">
                <div className="filters-search">
                    <label>
                        <input
                            type="text"
                            placeholder="Search restaurant"
                            className="filters-search-size"
                            value={searchRestaurant}
                            onChange={(e) => setSearchRestaurant(e.target.value)}
                        />
                    </label>
                    <button className="search-btn filters-search-size">Search</button>
                </div>
                <div className="filters-items">
                    <button className="filter-btn reset" onClick={handleAllRestaurant}>
                        Reset
                    </button>
                    <button className="filter-btn" onClick={handleFastDelivery}>
                        Fast Delivery
                    </button>
                    <button className="filter-btn" onClick={handleVeg}>
                        Pure Veg
                    </button>
                    <button className="filter-btn" onClick={handleRating}>
                        Ratings 4.2+
                    </button>
                    <button className="filter-btn" onClick={() => handleRange(1)}>
                        Rs. 300-Rs. 600
                    </button>
                    <button className="filter-btn" onClick={() => handleRange(2)}>
                        Less than Rs. 300
                    </button>
                </div>
            </div>
            <div className="res-cards">
                {filteredList.map((res) => (
                    <Link key={res.id} to={`/home/restaurant/${res.id}`}>
                        <SquareCard key={res.id} restaurantCardData={res} />
                    </Link>
                ))}
            </div>
        </div>
    );
}
