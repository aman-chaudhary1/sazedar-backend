# 🛒 Grocery App - Complete API Flow Guide

## 📱 **App Flow ke According API Usage**

---

## **1️⃣ APP STARTUP / SPLASH SCREEN**

### **1.1 Health Check**
```
GET /
```
**Kahan use:** App start par server check karne ke liye
**Response:** `{ success: true, message: "API running successfully" }`

### **1.2 Get All Posters (Banner Images)**
```
GET /posters
```
**Kahan use:** Home screen par banner/carousel images dikhane ke liye
**Response:** Array of posters with imageUrl

---

## **2️⃣ USER AUTHENTICATION FLOW**

### **2.1 User Registration**
```
POST /users/register
Body: {
  name, email, password, phoneNo (optional),
  profileImage (optional - multipart/form-data)
}
```
**Kahan use:** Signup screen par new user create karne ke liye
**Response:** User data + JWT token

### **2.2 User Login**
```
POST /users/login
Body: { email, password }
```
**Kahan use:** Login screen par
**Response:** User data + JWT token
**Important:** Token ko save karein (SharedPreferences/AsyncStorage)

### **2.3 Get User Profile (After Login)**
```
GET /users/profile
Headers: Authorization: Bearer <token>
```
**Kahan use:** 
- Login ke baad immediately call karein
- Profile screen par
- App restart ke baad (token check karke)
**Response:** User + Orders + Cart + Favorites + Addresses
**Important:** Isse cart aur favorites automatically load ho jayenge

---

## **3️⃣ HOME SCREEN / PRODUCT DISCOVERY**

### **3.1 Get All Categories**
```
GET /categories
```
**Kahan use:** Home screen par categories grid dikhane ke liye
**Response:** Array of categories with images

### **3.2 Get Today's Special Products**
```
GET /products?todaysSpecial=true
```
**Kahan use:** Home screen par "Today's Special" section
**Response:** Products with todaysSpecial flag

### **3.3 Get All Products**
```
GET /products
```
**Kahan use:** 
- All products screen
- Search results
- Category products list
**Response:** All products with populated category, brand, variants

### **3.4 Get Product by ID**
```
GET /products/:id
```
**Kahan use:** Product detail screen par
**Response:** Single product with full details

---

## **4️⃣ CATEGORY & FILTERING FLOW**

### **4.1 Get SubCategories by Category**
```
GET /subCategories
```
**Kahan use:** Category detail screen par subcategories dikhane ke liye
**Response:** SubCategories with categoryId populated

### **4.2 Get Brands by SubCategory**
```
GET /brands
```
**Kahan use:** Filter screen par brands list
**Response:** Brands with subcategoryId populated

### **4.3 Get Variant Types**
```
GET /variantTypes
```
**Kahan use:** Product filters (Size, Color, etc.)
**Response:** Variant types (e.g., "Size", "Color")

### **4.4 Get Variants by Type**
```
GET /variants
```
**Kahan use:** Product detail par variants select karne ke liye
**Response:** Variants with variantTypeId populated

---

## **5️⃣ CART MANAGEMENT**

### **5.1 Get User Cart**
```
GET /cart
Headers: Authorization: Bearer <token>
```
**Kahan use:**
- Cart screen par
- App startup (after login check)
- Cart icon badge count ke liye
**Response:** Cart with populated products

### **5.2 Add to Cart**
```
POST /cart/add
Headers: Authorization: Bearer <token>
Body: { productId, quantity, variant (optional) }
```
**Kahan use:** Product detail screen par "Add to Cart" button
**Response:** Updated cart

### **5.3 Update Cart Item Quantity**
```
PUT /cart/update
Headers: Authorization: Bearer <token>
Body: { productId, quantity }
```
**Kahan use:** Cart screen par quantity increase/decrease
**Response:** Updated cart

### **5.4 Remove from Cart**
```
DELETE /cart/remove/:productId
Headers: Authorization: Bearer <token>
```
**Kahan use:** Cart screen par remove button
**Response:** Updated cart

### **5.5 Clear Cart**
```
DELETE /cart/clear
Headers: Authorization: Bearer <token>
```
**Kahan use:** Cart screen par "Clear All" button
**Response:** Empty cart

---

## **6️⃣ FAVORITES / WISHLIST**

### **6.1 Get All Favorites**
```
GET /favorites
Headers: Authorization: Bearer <token>
```
**Kahan use:**
- Favorites/Wishlist screen
- App startup (after login)
**Response:** Array of favorite products

### **6.2 Add to Favorites**
```
POST /favorites
Headers: Authorization: Bearer <token>
Body: { productId }
```
**Kahan use:** Product detail screen par heart icon
**Response:** Added favorite product

### **6.3 Remove from Favorites**
```
DELETE /favorites/:productId
Headers: Authorization: Bearer <token>
```
**Kahan use:** 
- Favorites screen par remove
- Product detail par heart icon (unfavorite)
**Response:** Success message

### **6.4 Check if Product is Favorited**
```
GET /favorites/check/:productId
Headers: Authorization: Bearer <token>
```
**Kahan use:** Product detail screen par heart icon state check karne ke liye
**Response:** `{ isFavorited: true/false }`

---

## **7️⃣ ADDRESS MANAGEMENT**

### **7.1 Get All Addresses**
```
GET /api/address
Headers: Authorization: Bearer <token>
```
**Kahan use:**
- Address list screen
- Checkout screen par address select
**Response:** Array of user addresses

### **7.2 Get Single Address**
```
GET /api/address/:id
Headers: Authorization: Bearer <token>
```
**Kahan use:** Address detail/edit screen
**Response:** Single address

### **7.3 Add New Address**
```
POST /api/address
Headers: Authorization: Bearer <token>
Body: {
  phone, street, city, state, postalCode, country,
  addressType (home/work/other),
  label (optional),
  isDefault (optional)
}
```
**Kahan use:** Add address screen
**Response:** Created address

### **7.4 Update Address**
```
PUT /api/address/:id
Headers: Authorization: Bearer <token>
Body: { ...address fields }
```
**Kahan use:** Edit address screen
**Response:** Updated address

### **7.5 Delete Address**
```
DELETE /api/address/:id
Headers: Authorization: Bearer <token>
```
**Kahan use:** Address list screen par delete button
**Response:** Success message

### **7.6 Set Default Address**
```
PUT /api/address/:id/set-default
Headers: Authorization: Bearer <token>
```
**Kahan use:** Address list par "Set as Default" button
**Response:** Updated address with isDefault: true

---

## **8️⃣ COUPON / DISCOUNT FLOW**

### **8.1 Get All Coupons**
```
GET /couponCodes
```
**Kahan use:** Coupons screen / Offers section
**Response:** All available coupons

### **8.2 Get Coupon by ID**
```
GET /couponCodes/:id
```
**Kahan use:** Coupon detail screen
**Response:** Single coupon details

### **8.3 Validate Coupon Code**
```
POST /couponCodes/check-coupon
Body: { couponCode, productIds (array), purchaseAmount }
```
**Kahan use:** 
- Checkout screen par coupon apply karne se pehle
- Cart screen par coupon input
**Response:** Coupon validity + discount details
**Important:** Isse pehle validate karein, phir order create karein

---

## **9️⃣ CHECKOUT & ORDER FLOW**

### **9.1 Create Order**
```
POST /orders
Body: {
  userID,
  items: [{ productID, productName, quantity, price, variant }],
  totalPrice,
  shippingAddress: { phone, street, city, state, postalCode, country },
  paymentMethod: "cod" or "prepaid",
  couponCode (optional),
  orderTotal: { subtotal, discount, total },
  trackingUrl (optional)
}
```
**Kahan use:** Checkout screen par "Place Order" button
**Response:** Created order
**Important:** 
- Cart se items lein
- Address select karein
- Coupon validate karein
- Payment method select karein

### **9.2 Get User Orders**
```
GET /orders/orderByUserId/:userId
```
**Kahan use:** My Orders screen
**Response:** All orders of user

### **9.3 Get Order by ID**
```
GET /orders/:id
```
**Kahan use:** Order detail screen
**Response:** Single order with populated items

### **9.4 Update Order Status**
```
PUT /orders/:id
Body: { orderStatus, trackingUrl (optional) }
```
**Kahan use:** Admin panel se order status update
**Order Status:** pending, processing, shipped, delivered, cancelled

---

## **🔟 PAYMENT FLOW**

### **10.1 Stripe Payment**
```
POST /payment/stripe
Body: { email, name, address, amount, currency, description }
```
**Kahan use:** Checkout screen par Stripe payment select karne par
**Response:** paymentIntent, ephemeralKey, customer, publishableKey
**Flow:** 
1. User payment method select kare
2. Stripe API call karein
3. Payment complete hone ke baad order create karein

### **10.2 Razorpay Payment**
```
POST /payment/razorpay
```
**Kahan use:** Checkout screen par Razorpay select karne par
**Response:** Razorpay key
**Flow:**
1. Razorpay key lein
2. Razorpay SDK se payment initiate karein
3. Payment success ke baad order create karein

---

## **1️⃣1️⃣ NOTIFICATIONS**

### **11.1 Get All Notifications**
```
GET /notification/all-notification
```
**Kahan use:** Notifications screen
**Response:** All notifications

### **11.2 Track Notification Stats**
```
GET /notification/track-notification/:id
```
**Kahan use:** Admin panel par notification analytics
**Response:** Delivery stats

---

## **1️⃣2️⃣ ADMIN PANEL APIs**

### **12.1 Category Management**
```
GET    /categories          - Get all
POST   /categories          - Create (with image)
GET    /categories/:id      - Get by ID
PUT    /categories/:id      - Update
DELETE /categories/:id      - Delete
```

### **12.2 SubCategory Management**
```
GET    /subCategories       - Get all
POST   /subCategories       - Create
GET    /subCategories/:id   - Get by ID
PUT    /subCategories/:id   - Update
DELETE /subCategories/:id   - Delete
```

### **12.3 Brand Management**
```
GET    /brands              - Get all
POST   /brands              - Create
GET    /brands/:id           - Get by ID
PUT    /brands/:id          - Update
DELETE /brands/:id          - Delete
```

### **12.4 Variant Type Management**
```
GET    /variantTypes        - Get all
POST   /variantTypes        - Create
GET    /variantTypes/:id    - Get by ID
PUT    /variantTypes/:id    - Update
DELETE /variantTypes/:id    - Delete
```

### **12.5 Variant Management**
```
GET    /variants            - Get all
POST   /variants             - Create
GET    /variants/:id         - Get by ID
PUT    /variants/:id         - Update
DELETE /variants/:id         - Delete
```

### **12.6 Product Management**
```
GET    /products            - Get all
POST   /products            - Create (with images)
GET    /products/:id        - Get by ID
PUT    /products/:id        - Update
DELETE /products/:id        - Delete
```

### **12.7 Coupon Management**
```
GET    /couponCodes         - Get all
POST   /couponCodes         - Create
GET    /couponCodes/:id     - Get by ID
PUT    /couponCodes/:id     - Update
DELETE /couponCodes/:id     - Delete
```

### **12.8 Poster Management**
```
GET    /posters             - Get all
POST   /posters             - Create (with image)
GET    /posters/:id         - Get by ID
PUT    /posters/:id         - Update
DELETE /posters/:id         - Delete
```

### **12.9 Order Management**
```
GET    /orders              - Get all orders (admin)
GET    /orders/:id          - Get by ID
PUT    /orders/:id          - Update status
DELETE /orders/:id          - Delete
```

### **12.10 User Management**
```
GET    /users               - Get all users
GET    /users/:id           - Get by ID
DELETE /users/:id           - Delete user
```

### **12.11 Send Notification**
```
POST   /notification/send-notification
Body: { title, description, imageUrl (optional) }
```
**Kahan use:** Admin panel se push notification bhejne ke liye

---

## **📱 COMPLETE USER JOURNEY FLOW**

### **Flow 1: New User Registration**
1. App Open → `GET /` (Health check)
2. Splash Screen → `GET /posters` (Banners)
3. Signup Screen → `POST /users/register`
4. Auto Login → `POST /users/login`
5. Home Screen → `GET /users/profile` (Load cart, favorites)
6. Home Screen → `GET /categories` + `GET /products?todaysSpecial=true`

### **Flow 2: Existing User Login**
1. App Open → Check stored token
2. If token exists → `GET /users/profile` (Auto login)
3. If no token → Login Screen → `POST /users/login`
4. After login → `GET /users/profile` (Load all data)
5. Home Screen → `GET /categories` + `GET /products`

### **Flow 3: Product Browsing**
1. Home → `GET /categories`
2. Category Click → `GET /subCategories` + `GET /products` (filter by category)
3. Product Click → `GET /products/:id`
4. Product Detail → `GET /favorites/check/:productId` (Check favorite status)
5. Add to Cart → `POST /cart/add`
6. Add to Favorites → `POST /favorites`

### **Flow 4: Shopping Cart**
1. Cart Icon Click → `GET /cart`
2. Update Quantity → `PUT /cart/update`
3. Remove Item → `DELETE /cart/remove/:productId`
4. Proceed to Checkout → `GET /api/address` (Get addresses)

### **Flow 5: Checkout Process**
1. Checkout Screen → `GET /api/address` (Show addresses)
2. Select/Create Address → `POST /api/address` or `PUT /api/address/:id`
3. Apply Coupon → `POST /couponCodes/check-coupon`
4. Select Payment → `POST /payment/stripe` or `POST /payment/razorpay`
5. Place Order → `POST /orders`
6. After Order → `DELETE /cart/clear` (Clear cart)
7. Order Confirmation → `GET /orders/:id`

### **Flow 6: Order Tracking**
1. My Orders Screen → `GET /orders/orderByUserId/:userId`
2. Order Detail → `GET /orders/:id`
3. Track Order → Order object mein trackingUrl check karein

### **Flow 7: Profile Management**
1. Profile Screen → `GET /users/profile`
2. Edit Profile → `PUT /users/profile`
3. Address Management → `GET /api/address`
4. Add Address → `POST /api/address`
5. Edit Address → `PUT /api/address/:id`
6. Delete Address → `DELETE /api/address/:id`

---

## **🔐 AUTHENTICATION REQUIREMENTS**

### **Public APIs (No Token Required):**
- `GET /` (Health check)
- `GET /categories`
- `GET /subCategories`
- `GET /brands`
- `GET /variantTypes`
- `GET /variants`
- `GET /products`
- `GET /products/:id`
- `GET /posters`
- `GET /couponCodes`
- `POST /users/register`
- `POST /users/login`
- `POST /couponCodes/check-coupon`

### **Protected APIs (Token Required):**
- All `/cart/*` endpoints
- All `/favorites/*` endpoints
- All `/api/address/*` endpoints
- All `/orders/*` endpoints (except admin)
- `GET /users/profile`
- `PUT /users/profile`
- `GET /payment/*` (payment initiation)

---

## **📝 IMPORTANT NOTES**

1. **Token Storage:** Login ke baad token ko securely store karein
2. **Auto Login:** App startup par token check karke auto login
3. **Cart Sync:** Always `GET /cart` call karein app restart ke baad
4. **Favorites Sync:** Always `GET /favorites` call karein app restart ke baad
5. **Profile API:** `GET /users/profile` se sab kuch ek saath mil jayega
6. **Coupon Validation:** Order create karne se pehle coupon validate karein
7. **Payment Flow:** Payment success ke baad hi order create karein
8. **Address Default:** Checkout par default address automatically select karein

---

## **🚀 QUICK REFERENCE**

| Screen | APIs to Call |
|--------|-------------|
| Splash | `GET /`, `GET /posters` |
| Login | `POST /users/login` |
| Home | `GET /categories`, `GET /products?todaysSpecial=true`, `GET /users/profile` |
| Products | `GET /products`, `GET /products/:id` |
| Cart | `GET /cart`, `POST /cart/add`, `PUT /cart/update`, `DELETE /cart/remove/:id` |
| Favorites | `GET /favorites`, `POST /favorites`, `DELETE /favorites/:id` |
| Checkout | `GET /api/address`, `POST /couponCodes/check-coupon`, `POST /payment/*`, `POST /orders` |
| Orders | `GET /orders/orderByUserId/:userId`, `GET /orders/:id` |
| Profile | `GET /users/profile`, `PUT /users/profile` |
| Address | `GET /api/address`, `POST /api/address`, `PUT /api/address/:id`, `DELETE /api/address/:id` |

---

**Base URL:** `http://localhost:3000` (ya apna production URL)

**Token Format:** `Authorization: Bearer <your_jwt_token>`

