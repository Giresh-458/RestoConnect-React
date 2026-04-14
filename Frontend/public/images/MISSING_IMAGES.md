# Missing Dish Images

The following dishes in `Backend/seeds/seedData.js` do **not** have their own dedicated image and are currently using a substitute placeholder image. Please add the correct images for these dishes.

| # | Dish Name | Expected Image File | Currently Using (Placeholder) |
|---|-----------|-------------------|-------------------------------|
| 1 | Dhokla | `dhokla.jpg` | `samosa.jpg` |
| 2 | Kachumber Salad | `kachumber-salad.jpg` | `vegan-salad.jpg` |
| 3 | Mango Lassi | `mango-lassi.jpg` | `green-smoothie.jpg` |
| 4 | Chicken 65 | `chicken-65.jpg` | `tandoori-chicken.jpg` |
| 5 | Shrimp Scampi | `shrimp-scampi.jpg` | `prawn-masala.jpg` |
| 6 | Eggplant Parmesan | `eggplant-parmesan.jpg` | `vegan-burger.jpg` |
| 7 | Falafel Wrap | `falafel-wrap.jpg` | `burrito.jpg` |
| 8 | Thai Green Curry | `thai-green-curry.jpg` | `crab-curry.jpg` |

## Instructions

1. Add the correct image file for each dish to `Frontend/public/images/`
2. Once added, update the corresponding image path in `Backend/seeds/seedData.js`
3. Delete this file once all images have been added

## Notes

- All other **49 dishes** have their own correctly matched images.
- All **11 restaurant** images are present and correctly referenced.
