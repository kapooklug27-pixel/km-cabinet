# นำ KM Cabinet ขึ้นใช้งานด้วย GitHub Pages

โปรเจกต์นี้เตรียม GitHub Actions ไว้แล้ว เมื่อมีการส่งโค้ดเข้าสาขา main ระบบจะเผยแพร่ไฟล์จากโฟลเดอร์ dist โดยอัตโนมัติ

## 1. สร้าง Repository

1. เข้าสู่ระบบที่ https://github.com
2. กดเครื่องหมาย + มุมขวาบน แล้วเลือก New repository
3. ตั้งชื่อ เช่น km-cabinet
4. เลือก Public หากใช้บัญชี GitHub Free และต้องการใช้ Pages โดยไม่มีข้อจำกัดของ Repository ส่วนตัว
5. ไม่ต้องเลือกสร้าง README, .gitignore หรือ License เพราะโปรเจกต์มีไฟล์อยู่แล้ว
6. กด Create repository

## 2. นำโปรเจกต์ขึ้น GitHub

วิธีที่ง่ายที่สุดคือใช้ GitHub Desktop:

1. ติดตั้งและเข้าสู่ระบบ GitHub Desktop
2. เลือก File → Add local repository
3. เลือกโฟลเดอร์ KMCabinet
4. เลือก Repository → Repository settings → Remotes
5. เพิ่ม Remote ชื่อ origin และใส่ URL ของ Repository ที่สร้างไว้ เช่น https://github.com/USERNAME/km-cabinet.git
6. กด Publish repository หรือ Push origin

หากใช้ Git ใน Terminal ให้รันจากโฟลเดอร์โครงการ:

    git remote add origin https://github.com/USERNAME/km-cabinet.git
    git push -u origin main

เปลี่ยน USERNAME เป็นชื่อบัญชี GitHub ของคุณ

## 3. เปิด GitHub Pages

1. เปิด Repository บน GitHub
2. ไปที่ Settings → Pages
3. ในหัวข้อ Build and deployment
4. เลือก Source: GitHub Actions
5. ไปที่แท็บ Actions และรอรายการ Deploy KM Cabinet to GitHub Pages แสดงเครื่องหมายถูกสีเขียว

เมื่อสำเร็จ URL จะมีรูปแบบ:

    https://USERNAME.github.io/km-cabinet/

## 4. อัปเดตเว็บไซต์ครั้งต่อไป

แก้ไฟล์และคัดลอกไฟล์ล่าสุดเข้า dist จากนั้น Commit และ Push ไปยัง main ระบบ GitHub Actions จะเผยแพร่เว็บใหม่ให้อัตโนมัติ

## หมายเหตุเรื่องข้อมูล

KM Cabinet เวอร์ชันนี้บันทึกร่าง รายการความรู้ บุคลากร และสถานะไว้ในเบราว์เซอร์ของผู้ใช้แต่ละเครื่อง หากต้องการให้ผู้ใช้หลายคนเห็นข้อมูลชุดเดียวกัน ต้องเพิ่มฐานข้อมูล ระบบเข้าสู่ระบบ และบริการฝั่งเซิร์ฟเวอร์ ซึ่ง GitHub Pages เพียงอย่างเดียวไม่รองรับ
