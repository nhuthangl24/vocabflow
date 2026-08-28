-- Thêm cột module trực tiếp vào media_assets để tách vocabulary vs shadowing ở tầng DB
ALTER TABLE media_assets ADD COLUMN module TEXT NOT NULL DEFAULT 'vocabulary';

-- Cập nhật các asset hiện tại đã thuộc shadowing (dựa vào transcript_jobs.settings)
UPDATE media_assets 
SET module = 'shadowing' 
WHERE id IN (
  SELECT media_asset_id FROM transcript_jobs 
  WHERE settings->>'module' = 'shadowing'
);

-- Tạo index cho query performance
CREATE INDEX idx_media_assets_module ON media_assets(module);
CREATE INDEX idx_media_assets_user_module ON media_assets(user_id, module);
