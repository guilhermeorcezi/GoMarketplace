import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // TODO LOAD ITEMS FROM ASYNC STORAGE
      const StoragedProducts = await AsyncStorage.getItem('@GoMarketplace');

      if (StoragedProducts) {
        setProducts([...JSON.parse(StoragedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productAlreadyInCart = Boolean(
        products.find(cartProduct => cartProduct.id === product.id),
      );

      if (productAlreadyInCart) {
        increment(product.id);
      } else {
        await AsyncStorage.setItem('@GoMarketplace', JSON.stringify(product));
        setProducts(oldProducts => [
          ...oldProducts,
          { ...product, quantity: 1 },
        ]);
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const updatedProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      setProducts(updatedProducts);
      await AsyncStorage.setItem(
        '@GoMarketplace',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);

      if (products[productIndex].quantity === 1) {
        const productsUpdated = products.filter(product => product.id !== id);

        setProducts(productsUpdated);
        await AsyncStorage.setItem(
          '@GoMarketplace',
          JSON.stringify(productsUpdated),
        );
      } else {
        const updatedProducts = products.map(product =>
          product.id === id
            ? { ...product, quantity: product.quantity - 1 }
            : product,
        );

        setProducts(updatedProducts);
        await AsyncStorage.setItem(
          '@GoMarketplace',
          JSON.stringify(updatedProducts),
        );
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
