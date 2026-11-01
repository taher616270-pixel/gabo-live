# إعداد قائمة الدول في GABO LIVE (Firestore فقط)

تُحفظ تعديلات قائمة الدول داخل مجموعة Firestore `country_registry`، ويُحفظ إخفاء الدول الافتراضية داخل `country_registry_meta/main`.

## تخزين صور الأعلام

- لا يستخدم المشروع Firebase Storage.
- يضغط المتصفح الصورة إلى JPEG قبل الحفظ.
- تُحفظ الصورة المضغوطة كـ Data URL داخل الحقل `flag` في وثيقة الدولة.
- الحد الأقصى للحقل بعد الضغط 350,000 حرف، لتجنب تجاوز حجم وثيقة Firestore.
- لا ترفع ملفات الأعلام إلى مسارات Storage ولا تنشر قواعد Storage.

## الحقول

`country_registry/{countryCode}`:
- `name`: اسم الدولة.
- `flag`: رابط صورة عام أو Data URL مضغوط.

`country_registry_meta/main`:
- `disabledCodes`: قائمة رموز الدول الافتراضية المخفية.
- `updatedAt`: وقت آخر تحديث.
- `updatedBy`: UID المدير.

تسمح قواعد Firestore للقراءة العامة لقائمة الدول، وتقيّد الإنشاء والتعديل والحذف بحساب الإدارة `taher616380@gmail.com` أو مستخدم موثوق بعلامة الإدارة في وثيقة المستخدم.
