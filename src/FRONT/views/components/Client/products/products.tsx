import React, { useState } from "react";
import styles from "./products.module.css";

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  inStock: boolean;
}

// Datos de ejemplo para productos de barbería
const mockProducts: Product[] = [
  {
    id: 1,
    name: "Espuma de Afeitar Premium",
    price: 18.5,
    description: "Espuma rica y cremosa para un afeitado suave y preciso",
    image:
      "https://images.unsplash.com/photo-1564073056985-80c0a4b1e4a3?w=300&h=200&fit=crop",
    category: "Afeitado",
    inStock: true,
  },
  {
    id: 2,
    name: "Gel Fijador Extra Fuerte",
    price: 12.0,
    description: "Gel de máxima fijación para peinados que duran todo el día",
    image:
      "https://images.unsplash.com/photo-1562887284-5ad9b9a1dd93?w=300&h=200&fit=crop",
    category: "Styling",
    inStock: true,
  },
  {
    id: 3,
    name: "Aceite para Barba Natural",
    price: 25.0,
    description: "Aceite 100% natural para nutrir y dar brillo a tu barba",
    image:
      "https://images.unsplash.com/photo-1635241161466-541ac25a6e88?w=300&h=200&fit=crop",
    category: "Cuidado de Barba",
    inStock: false,
  },
  {
    id: 4,
    name: "Champú Anticaspa",
    price: 15.75,
    description:
      "Champú especializado para eliminar la caspa y fortalecer el cabello",
    image:
      "https://images.unsplash.com/photo-1556228724-f6f958db8b0d?w=300&h=200&fit=crop",
    category: "Cuidado Capilar",
    inStock: true,
  },
  {
    id: 5,
    name: "Cera Modeladora Mate",
    price: 20.0,
    description: "Cera de acabado mate para texturas naturales y flexibles",
    image:
      "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=300&h=200&fit=crop",
    category: "Styling",
    inStock: true,
  },
  {
    id: 6,
    name: "Loción Post-Afeitado",
    price: 22.5,
    description: "Loción calmante y refrescante para después del afeitado",
    image:
      "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=300&h=200&fit=crop",
    category: "Afeitado",
    inStock: true,
  },
  {
    id: 7,
    name: "Pomada Brillantina Clásica",
    price: 16.0,
    description: "Pomada tradicional con alto brillo para looks vintage",
    image:
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=300&h=200&fit=crop",
    category: "Styling",
    inStock: true,
  },
  {
    id: 8,
    name: "Bálsamo para Barba",
    price: 28.0,
    description: "Bálsamo hidratante y acondicionador para barbas largas",
    image:
      "https://images.unsplash.com/photo-1574594137545-b65e3e5c9b9a?w=300&h=200&fit=crop",
    category: "Cuidado de Barba",
    inStock: true,
  },
];

const Products: React.FC = () => {
  const [cart, setCart] = useState<Product[]>([]);
  const [filter, setFilter] = useState<string>("all");

  const addToCart = (product: Product) => {
    if (product.inStock) {
      setCart([...cart, product]);
      alert(`${product.name} añadido al carrito`);
    }
  };

  const categories = [
    "all",
    ...Array.from(new Set(mockProducts.map((p) => p.category))),
  ];

  const filteredProducts =
    filter === "all"
      ? mockProducts
      : mockProducts.filter((product) => product.category === filter);

  return (
    <div className={styles["products-container"]}>
      <div className={styles["products-header"]}>
        <h1>Productos de Barbería</h1>
        <div className={styles["cart-info"]}>
          Carrito: {cart.length} productos
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
            </div>

            <div className={styles["product-info"]}>
              <div className={styles["product-category"]}>
                {product.category}
              </div>
              <h3 className={styles["product-name"]}>{product.name}</h3>
              <p className={styles["product-description"]}>
                {product.description}
              </p>

              <div className={styles["product-footer"]}>
                <div className={styles["product-price"]}>
                  ${product.price.toFixed(2)}
                </div>
                <button
                  className={`${styles["add-to-cart-btn"]} ${
                    !product.inStock ? styles.disabled : ""
                  }`}
                  onClick={() => addToCart(product)}
                  disabled={!product.inStock}
                >
                  {product.inStock ? "Añadir al Carrito" : "Agotado"}
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
