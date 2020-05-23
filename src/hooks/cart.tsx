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

const incrementProductsInCart = (
  previousStateProducts: Product[],
  id: string,
): Product[] => {
  return previousStateProducts.map(product => {
    if (product.id === id) {
      return { ...product, quantity: product.quantity + 1 };
    }
    return product;
  });
};

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const product = await AsyncStorage.getItem('@goMarketplace: card');

      if (product) {
        const parsedProducts: Product[] = await JSON.parse(product);
        setProducts(parsedProducts);
      }
    }

    loadProducts();
  }, []);

  const updateStorage = useCallback(async () => {
    await AsyncStorage.setItem(
      '@goMarketplace: card',
      JSON.stringify(products),
    );
  }, [products]);

  const addToCart = useCallback(
    async product => {
      setProducts(previousStateProducts => {
        const indexProduct = previousStateProducts.findIndex(
          prod => prod.id === product.id,
        );

        if (indexProduct !== -1) {
          return incrementProductsInCart(previousStateProducts, product.id);
        }

        return [...previousStateProducts, { ...product, quantity: 1 }];
      });
      await updateStorage();
    },
    [updateStorage],
  );

  const increment = useCallback(
    async id => {
      setProducts(previousStateProducts =>
        incrementProductsInCart(previousStateProducts, id),
      );
      await updateStorage();
    },
    [updateStorage],
  );

  const decrement = useCallback(
    async id => {
      setProducts(previousStateProducts => {
        return previousStateProducts.map(product => {
          if (product.id === id && product.quantity > 1) {
            return { ...product, quantity: product.quantity - 1 };
          }
          return product;
        });
      });
      await updateStorage();
    },
    [updateStorage],
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
