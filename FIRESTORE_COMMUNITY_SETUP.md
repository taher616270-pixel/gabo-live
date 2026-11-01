# إعداد المجتمعات الرسمية الخمسة في GABO LIVE

هذه الإضافة تسمح لحساب الإدارة بإنشاء وثائق المجتمعات الرسمية الخمسة فقط إذا كانت غير موجودة. زر التهيئة في `/admin/` يحدّث اسم وعلم الوثيقة الموجودة دون استبدال قائمة الأعضاء.

## قبل الضغط على زر التهيئة

داخل `match /databases/{database}/documents` في Firestore Rules، أضف كتلة السماح التالية. تعتمد على دالة `isAdmin()` الموجودة في قواعد المشروع:

```javascript
match /communities/{communityId} {
  allow create: if isAdmin()
    && communityId in ['south', 'sa', 'ae', 'om', 'ye']
    && request.resource.data.keys().hasOnly([
      'id', 'name', 'flag', 'type', 'description',
      'members', 'membersCount', 'joinsToday', 'joinsDay',
      'activityScore', 'activityDay', 'createdAt'
    ])
    && request.resource.data.members is list
    && request.resource.data.members.size() == 0
    && request.resource.data.membersCount == 0
    && request.resource.data.type == 'community'
    && (
      (communityId == 'south' && request.resource.data.name == 'مجتمع الجنوب العربي' && request.resource.data.flag == 'south') ||
      (communityId == 'sa' && request.resource.data.name == 'مجتمع السعودية' && request.resource.data.flag == 'sa') ||
      (communityId == 'ae' && request.resource.data.name == 'مجتمع الإمارات' && request.resource.data.flag == 'ae') ||
      (communityId == 'om' && request.resource.data.name == 'مجتمع عُمان' && request.resource.data.flag == 'om') ||
      (communityId == 'ye' && request.resource.data.name == 'مجتمع اليمن' && request.resource.data.flag == 'ye')
    );
}
```

هذه كتلة إضافية داخل المسار الرئيسي وليست بديلاً عن قواعد المشروع الحالية. لا تستبدل بقية القواعد بها.

## معرّفات المجتمعات الرسمية

- `south` — مجتمع الجنوب العربي
- `sa` — مجتمع السعودية
- `ae` — مجتمع الإمارات
- `om` — مجتمع عُمان
- `ye` — مجتمع اليمن

## تنبيه مهم بشأن حذف البيانات القديمة

تعديل ملفات الموقع لا يحذف بيانات Firestore. لم يتم حذف أي وثيقة أو رسالة أو عضوية. يلزم أولاً إنشاء نسخة احتياطية قابلة للاستعادة، ثم تنفيذ حذف إداري موثوق للوثائق القديمة ورسائلها وعضوياتها. لا تستخدم زر حذف وثيقة منفردة في لوحة الإدارة كبديل عن عملية الترحيل الكاملة.
