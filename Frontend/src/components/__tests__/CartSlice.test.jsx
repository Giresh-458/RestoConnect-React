import reducer, {
  addItem,
  clearcart,
  removeItem,
  setPromoCode,
} from '../../store/CartSlice';

describe('CartSlice', () => {
  test('tracks quantities and running total as items are added and removed', () => {
    let state = reducer(undefined, addItem({ id: 'dish-1', amount: 150 }));
    state = reducer(state, addItem({ id: 'dish-1', amount: 150 }));

    expect(state.dishes).toEqual([{ id: 'dish-1', amount: 150, quantity: 2 }]);
    expect(state.amount).toBe(300);

    state = reducer(state, removeItem({ id: 'dish-1', amount: 150 }));

    expect(state.dishes).toEqual([{ id: 'dish-1', amount: 150, quantity: 1 }]);
    expect(state.amount).toBe(150);
  });

  test('stores promo metadata and clears the cart back to its default state', () => {
    let state = reducer(undefined, addItem({ id: 'dish-2', amount: 220 }));
    state = reducer(state, setPromoCode({ code: 'SAVE20', discount: 20 }));

    expect(state.promoCode).toBe('SAVE20');
    expect(state.promoDiscount).toBe(20);

    state = reducer(state, clearcart());

    expect(state).toEqual({
      dishes: [],
      reservation: {},
      amount: 0,
      restId: null,
      restName: '',
      promoCode: null,
      promoDiscount: 0,
    });
  });
});
