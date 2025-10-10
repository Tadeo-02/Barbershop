import React, { useState } from "react";
import styles from "./products.module.css";
import { useCart } from "../../CartContext";

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  inStock: boolean;
}

interface CartAnimation {
  productId: number;
  show: boolean;
}

// Datos de ejemplo para productos de barbería
const mockProducts: Product[] = [
  {
    id: 8,
    name: "Bálsamo para Barba",
    price: 28.0,
    description: "Bálsamo hidratante y acondicionador para barbas largas",
    image:
      "https://http2.mlstatic.com/D_NQ_NP_826800-MLA84987942320_052025-Ow=300&h=200&fit=crop",
    category: "Cuidado de Barba",
    inStock: true,
  },
  {
    id: 2,
    name: "Gel Fijador Extra Fuerte",
    price: 12.0,
    description: "Gel de máxima fijación para peinados que duran todo el día",
    image:
      "https://casa-dora.shop/cdn/shop/products/IMG_20180424_140500883_530x.png?v=1528122471w=300&h=200&fit=crop",
    category: "Styling",
    inStock: true,
  },
  {
    id: 3,
    name: "Aceite para Barba Natural",
    price: 25.0,
    description: "Aceite 100% natural para nutrir y dar brillo a tu barba",
    image:
      "https://http2.mlstatic.com/D_Q_NP_786314-MLU78029615972_082024-O.webpw=300&h=200&fit=crop",
    category: "Cuidado de Barba",
    inStock: false,
  },
  {
    id: 5,
    name: "Cera Modeladora Mate",
    price: 20.0,
    description: "Cera de acabado mate para texturas naturales y flexibles",
    image:
      "https://farmacityar.vtexassets.com/arquivos/ids/270369-800-auto?v=638827555479530000&width=800&height=auto&aspect=truew=300&h=200&fit=crop",
    category: "Styling",
    inStock: true,
  },
  {
    id: 6,
    name: "Loción Post-Afeitado",
    price: 22.5,
    description: "Loción calmante y refrescante para después del afeitado",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGTp5Lhjz5XUvwFAIM3uaoaMZNF6EQUdNbXA&sw=300&h=200&fit=crop",
    category: "Afeitado",
    inStock: true,
  },
  {
    id: 7,
    name: "Pomada Brillantina Clásica",
    price: 16.0,
    description: "Pomada tradicional con alto brillo para looks vintage",
    image:
      "https://melbrosco.com/cdn/shop/files/Clasica.png?v=1752156360w=300&h=200&fit=crop",
    category: "Styling",
    inStock: true,
  },
  {
    id: 1,
    name: "Espuma de Afeitar Premium",
    price: 18.5,
    description: "Espuma rica y cremosa para un afeitado suave y preciso",
    image:
      "https://farmaciasdelpueblo.vtexassets.com/arquivos/ids/183443/Gillette-Espuma-De-Afeitar-Gillette-Foamy-Regular-x-312gr-7500435224604_img1.png?v=638234036377330000w=300&h=200&fit=crop",
    category: "Afeitado",
    inStock: true,
  },
];

const Products: React.FC = () => {
  const { addItem } = useCart();
  const [filter] = useState<string>("all");
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [cartAnimation, setCartAnimation] = useState<CartAnimation | null>(
    null
  );

  const handleQuantityChange = (productId: number, quantity: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  const getQuantity = (productId: number) => {
    return quantities[productId] || 1;
  };

  const addToCart = (product: Product) => {
    if (product.inStock) {
      const quantity = getQuantity(product.id);

      // Mostrar animación
      setCartAnimation({ productId: product.id, show: true });

      // Añadir al contexto del carrito
      addItem(
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
        },
        quantity
      );

      // Ocultar animación después de 2 segundos
      setTimeout(() => {
        setCartAnimation(null);
      }, 2000);
    }
  };


  const filteredProducts =
    filter === "all"
      ? mockProducts
      : mockProducts.filter((product) => product.category === filter);

  return (
    <div className={styles["products-container"]}>
      <div className={styles["products-header"]}>
        <h1>Productos de Barbería</h1>
        <div className={styles["cart-info"]}>
          {/* ahora el header muestra el resumen global; dejamos esto informativo */}
          Añade productos con "Añadir al Carrito" y abre el carrito desde el ícono superior.
        </div>
      </div>

      <div className={styles.filters}>
        {/* {categories.map((category) => (
          <button
            key={category}
            className={`${styles["filter-btn"]} ${
              filter === category ? styles.active : ""
            }`}
            onClick={() => setFilter(category)}
          >
            {category === "all" ? "Todos" : category}
          </button>
        ))} */}
      </div>

      <div className={styles["products-grid"]}>
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className={`${styles["product-card"]} ${
              !product.inStock ? styles["out-of-stock"] : ""
            }`}
          >
            <div className={styles["product-image"]}>
              <img
                src={product.image}
                alt={product.name}
                onError={(e) => {
                  e.currentTarget.src = `https://via.placeholder.com/300x200/3498db/ffffff?text=${encodeURIComponent(
                    product.name
                  )}`;
                }}
              />
              {!product.inStock && (
                <div className={styles["out-of-stock-overlay"]}>Agotado</div>
              )}

              {/* Animación de añadido al carrito */}
              {cartAnimation?.productId === product.id &&
                cartAnimation.show && (
                  <div className={styles["cart-animation"]}>
                    <div className={styles["cart-animation-content"]}>
                      <div className={styles["cart-icon"]}>🛒</div>
                      <div className={styles["cart-text"]}>
                        ¡Añadido al carrito!
                      </div>
                      <div className={styles["cart-quantity"]}>
                        {getQuantity(product.id)} x {product.name}
                      </div>
                    </div>
                  </div>
                )}
            </div>

            <div className={styles["product-info"]}>
              <h3 className={styles["product-name"]}>{product.name}</h3>
              <p className={styles["product-description"]}>
                {product.description}
              </p>

              <div className={styles["product-footer"]}>
                <div className={styles["product-price"]}>
                  ${product.price.toFixed(2)}
                </div>
                <div className={styles["quantity-selector"]}>
                  <label htmlFor={`quantity-${product.id}`}>Cantidad:</label>
                  <select
                    id={`quantity-${product.id}`}
                    value={getQuantity(product.id)}
                    onChange={(e) =>
                      handleQuantityChange(product.id, parseInt(e.target.value))
                    }
                    disabled={!product.inStock}
                    className={styles["quantity-select"]}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  className={`${styles["add-to-cart-btn"]} ${
                    !product.inStock ? styles.disabled : ""
                  } ${
                    cartAnimation?.productId === product.id &&
                    cartAnimation.show
                      ? styles["btn-loading"]
                      : ""
                  }`}
                  onClick={() => addToCart(product)}
                  disabled={
                    !product.inStock ||
                    (cartAnimation?.productId === product.id &&
                      cartAnimation.show)
                  }
                >
                  {cartAnimation?.productId === product.id && cartAnimation.show
                    ? "Añadiendo..."
                    : product.inStock
                    ? "Añadir al Carrito"
                    : "Agotado"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;
