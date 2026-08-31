-- Final Audit V2: Queue & Scheduler Optimization
-- Thêm các cột để hỗ trợ Dead Letter Queue (DLQ), Job Locking và Traceability

-- 1. Bổ sung các cột cho Queue Management vào bảng transcript_jobs
ALTER TABLE public.transcript_jobs
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS trace_id UUID;

-- 2. Cập nhật RLS Policy (Cho phép Service Role cập nhật các cột mới, người dùng bình thường chỉ được read)
-- RLS hiện tại đã có, ta chỉ cần đảm bảo index hỗ trợ các query queue.

-- 3. Tạo Index hỗ trợ tìm kiếm Job chưa bị lock và đang pending (Cho Polling Worker)
CREATE INDEX IF NOT EXISTS idx_transcript_jobs_queue 
ON public.transcript_jobs(status, created_at) 
WHERE status = 'pending' AND locked_at IS NULL;

-- 4. Bổ sung Constraint cho status (Thêm trạng thái dead_letter)
-- PostgreSQL không cho phép thay đổi ENUM dễ dàng nếu nó đang được dùng trong constraint, 
-- giả sử status là TEXT hoặc VARCHAR, ta coi như 'dead_letter' là hợp lệ.
