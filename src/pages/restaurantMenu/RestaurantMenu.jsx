import { useEffect, useState } from "react";
import "./restaurantmenu.css";
import Accordion from "../../components/accordion/Accordion";
import MenuHeader from "../../components/menu-header/MenuHeader";
import { useParams } from "react-router-dom";
import RestaurantShimmer from "../../components/shimmer/RestaurantShimmer";
import MenuFooter from "../../components/menu-footer/MenuFooter";

const RestaurantMenu = () => {
    const { resId } = useParams();
    const [loading, setLoading] = useState(true);
    const [headerData, setHeaderData] = useState({});
    const [menuData, setMenuData] = useState([]);
    const [footerData, setFooterData] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch(
                `https://www.swiggy.com/dapi/menu/pl?page-type=REGULAR_MENU&complete-menu=true&lat=26.8947446&lng=75.8301169&restaurantId=${resId}&catalog_qa=undefined&submitAction=ENTER`,
            );
            const json = await response.json();
            const data = json?.data?.cards;
            const header = data[2]?.card?.card?.info;
            const menu = data[4]?.groupedCard?.cardGroupMap?.REGULAR?.cards;
            const { imageId, text } = menu[menu.length - 2]?.card?.card || {};
            const { name, area, completeAddress } = menu[menu.length - 1]?.card?.card || {};
            const footer = { imageId, text, name, area, completeAddress };

            setHeaderData(header || {});
            setMenuData(menu || []);
            setFooterData(footer || {});
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <RestaurantShimmer />;
    }

    return (
        <div className="restaurant-menu">
            <div className="restaurant-subpage">
                <div className="restaurant-subpage-header">
                    <MenuHeader data={headerData} />
                </div>
                <div className="menu">
                    <div className="menu-main-title">
                        <span>෴ M E N U ෴</span>
                    </div>
                    {menuData.map((cardData, index) => {
                        const card = cardData.card?.card;
                        if (!card?.title) return null;

                        if (card?.itemCards) {
                            return (
                                <Accordion
                                    key={index}
                                    card={card}
                                    index={index}
                                    isSubCard={false}
                                />
                            );
                        } else {
                            return (
                                <div key={index}>
                                    <div className="menu-heading">
                                        <span className="menu-heading-title">{card.title}</span>
                                    </div>
                                    {card?.categories?.map((subCardData, subIndex) => {
                                        return (
                                            <Accordion
                                                key={subIndex}
                                                card={subCardData}
                                                index={subIndex}
                                                isSubCard={true}
                                            />
                                        );
                                    })}
                                    {index !== menuData.length - 3 && (
                                        <div className="menu-separator"></div>
                                    )}
                                </div>
                            );
                        }
                    })}
                </div>
                <div>
                    <MenuFooter data={footerData} />
                </div>
            </div>
        </div>
    );
};

export default RestaurantMenu;
