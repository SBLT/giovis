import Image from "next/image";
import Icon from "./icons";
import Button from "./buttons";
import { roundDown } from "utils/numbers";
import { useAuth } from "provider/auth";
import { useEffect, useRef, useState } from "react";
import { db } from "db/firebase";
import { toast } from "./toasts";

export default function Product(props) {
  const {
    pin = "",
    src = "",
    name = "",
    amount = 0,
    fraction = 0,
    sizes = [],
  } = props?.data || {};

  const discount = ((amount - fraction) / amount) * 100;
  const isFraction = Boolean(fraction);

  // End values
  const disc = roundDown(discount, 2);
  const sales = roundDown(fraction, 2);

  // Favorite
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);

  const toggleFav = (e) => {
    e.target.style.transform = "scale(1.1)";

    if (user?.role == "administrador") {
      setTimeout(() => {
        e.target.style.transform = "";
      }, 100);

      return toast({
        value: "El administrador no puede guardar favoritos",
        type: "warning",
      });
    }

    if (!user?.email) {
      toast({
        value: "Necesita iniciar sesión para acceder a esta opción",
        type: "warning",
      });
    }

    if (user && pin) {
      let favorites = user?.favorites ?? [];

      if (isLiked) {
        const newList = favorites?.filter((key) => key != pin) ?? [];
        db.collection("users").doc(user?.uid).update({ favorites: newList });
        setIsLiked(false);
      } else {
        const newList = [...favorites, pin];
        db.collection("users").doc(user?.uid).update({ favorites: newList });
        setIsLiked(true);
      }
    }

    setTimeout(() => {
      e.target.style.transform = "";
    }, 100);
  };

  // Cart
  const tallas = useRef(null);
  const [selectedSizes, setSelectedSizes] = useState([]);

  const handleAddToCart = async () => {
    if (selectedSizes.length == 0) return;
    if (!user) {
      return toast({
        value: "Necesita iniciar sesión para acceder a esta opción",
        type: "warning",
      });
    }

    let cart;
    await db
      .collection("carts")
      .where("uid", "==", `${user?.uid}`)
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          cart = { list: doc.data()?.cart, id: doc.id };
        });
      })
      .catch((error) => {
        console.log("Error getting documents: ", error);
      });

    let list = [];
    selectedSizes.forEach((size) => {
      list.push({
        cuantity: 1,
        size: size,
        pin: pin,
      });
    });

    if (cart == undefined) {
      db.collection("carts").add({
        cart: list,
        uid: user?.uid,
      });
    } else if (cart?.list == undefined || cart?.list?.length == 0) {
      db.collection("carts").doc(cart?.id).update({
        cart: list,
      });
    } else {
      let cart_pins = [];
      let list_pins = [];

      //
      //
      // Filter the pin and size of the products in the cart ==> Convert to string
      cart?.list.forEach((item) => {
        cart_pins.push(JSON.stringify({ pin: item.pin, size: item.size }));
      });

      //
      //
      // Filter the pin and size of the products in the list ==> Convert to string
      list?.forEach((item) => {
        list_pins.push(JSON.stringify({ pin: item.pin, size: item.size }));
      });

      //
      //
      // Get the pins and sizes of the products to be added to the cart
      let add = list_pins.filter((elemento) => {
        if (cart_pins.indexOf(elemento) == -1) {
          return elemento;
        }
      });
      add = add.map((elemento) => JSON.parse(elemento)); // Convert to object

      //
      //
      // Get the pins and sizes of the products that did not change
      let keep = cart_pins.filter((elemento) => {
        if (list_pins.indexOf(elemento) == -1) {
          return elemento;
        }
      });
      keep = keep.map((elemento) => JSON.parse(elemento)); // Convert to object

      //
      //
      // Get the pins and sizes of the products that need to be upgraded
      let update = cart_pins.filter((elemento) => {
        if (list_pins.indexOf(elemento) >= 0) {
          return elemento;
        }
      });
      update = update.map((elemento) => JSON.parse(elemento)); // Convert to object

      //
      //
      // Get new cart data
      let new_list = [];

      // Updated
      cart?.list.forEach((item) => {
        update.forEach((elemento) => {
          if (item.pin == elemento.pin && item.size == elemento.size) {
            new_list.push({ ...item, cuantity: item.cuantity + 1 });
          }
        });
      });

      // Keep
      cart?.list.forEach((item) => {
        keep.forEach((elemento) => {
          if (item.pin == elemento.pin && item.size == elemento.size) {
            new_list.push({ ...item });
          }
        });
      });

      // Add
      list.forEach((item) => {
        add.forEach((elemento) => {
          if (item.pin == elemento.pin && item.size == elemento.size) {
            new_list.push({ ...item });
          }
        });
      });

      db.collection("carts").doc(cart?.id).update({
        cart: new_list,
      });
    }

    // Clear fields
    setSelectedSizes([]);
    tallas.current.querySelectorAll("li").forEach((item) => {
      item.removeAttribute("state");
    });
  };

  const handleSelectSize = (e) => {
    const clicked_size = e.target.closest("li");
    if (!clicked_size) return;

    const value = clicked_size.textContent;
    if (selectedSizes.indexOf(value) >= 0) {
      setSelectedSizes(selectedSizes.filter((size) => size != value));
      e.target.removeAttribute("state");
    } else {
      setSelectedSizes([...selectedSizes, value]);
      e.target.setAttribute("state", "is-selected");
    }
  };

  useEffect(() => {
    const isListed = user?.favorites?.filter((key) => key == pin);
    if (isListed?.length > 0) setIsLiked(true);
    else setIsLiked(false);
  }, [user]);

  return (
    <article className="product">
      <header>
        <Image src={src || "/images/ghost.png"} alt={name} layout="fill" />

        <button onClick={(e) => toggleFav(e)}>
          <Icon name={isLiked ? "heart@bold" : "heart@border"} />
        </button>
      </header>
      <div>
        <div>
          {amount != fraction && isFraction ? (
            <>
              <span role="amount">{`S/ ${roundDown(amount, 2)}`}</span>
              <span role="fraction">{`S/ ${roundDown(sales, 2)}`}</span>
              <span role="discount">{`${-roundDown(disc)}%`}</span>
            </>
          ) : (
            <span role="fraction">{`S/ ${roundDown(amount || 0, 2)}`}</span>
          )}
        </div>

        <h2>{name || "Nombre del producto"}</h2>

        <ul onClick={(e) => handleSelectSize(e)} ref={tallas}>
          {sizes?.length == 0 ? null : <p>Tallas</p>}

          {sizes?.length <= 0
            ? null
            : sizes?.map((size, index) => <li key={index}>{size}</li>)}

          <Button
            size="small"
            variant="ghost"
            onClick={() => handleAddToCart()}
          >
            <Icon name="buy@broken" />
          </Button>
        </ul>
      </div>
    </article>
  );
}
