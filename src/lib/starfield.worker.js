// The About section's starfield on its own thread (see offscreen.js).
import { serve } from './offscreen'
import { create } from './starfield'

serve(create)
