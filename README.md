Tech Stack:
├── Frontend: Next.js + Tailwind CSS (beautiful, fast)
├── Backend/Database: Convex (realtime, easy)
├── Payments: Stripe
├── Hosting: Vercel (free tier)
├── Analytics: Google Analytics + Plausible


convex 
    database stroes products orders and users
    realtime updates inventory changes when an order is placed
    backend functions process orders and validate data
    no server management (they do it)

**Full Project Structure:**
my-store/
├── app/
│   ├── page.tsx           # Homepage/Portfolio
│   ├── shop/
│   │   └── page.tsx       # Shop page
│   ├── product/
│   │   └── [id]/page.tsx  # Product details
│   └── admin/
│       └── page.tsx       # Your admin dashboard
├── components/
│   ├── Hero.tsx           # Portfolio hero section
│   ├── ProductCard.tsx
│   ├── Cart.tsx
│   └── Navbar.tsx
├── convex/
│   ├── schema.ts          # Database schema
│   ├── products.ts        # Product queries/mutations
│   ├── orders.ts          # Order handling
│   └── stripe.ts          # Payment processing
├── styles/
│   └── globals.css        # Tailwind styles
└── public/
    └── images/

need to do
make page use tailwind css 
set up stripe