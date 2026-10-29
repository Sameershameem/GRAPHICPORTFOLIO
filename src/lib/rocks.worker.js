// The closing section's 3D rocks on their own thread (see offscreen.js).
import { serve } from './offscreen'
import { create } from './rocks'

serve(create)
